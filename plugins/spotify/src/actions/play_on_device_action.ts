import { streamDeck } from '@elgato/streamdeck';
import { SingletonAction } from '@elgato/streamdeck';
import type {
	DidReceiveSettingsEvent,
	KeyAction,
	KeyDownEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import { toSvgDataUrl } from 'deck-kit/text/to_svg_data_url';

import { listSpotifyDevices } from '../spotify/list_spotify_devices';
import { runSpotifyQuery } from '../spotify/run_spotify_query';
import type { SpotifyDevice } from '../spotify/spotify_device';
import { transferSpotifyPlayback } from '../spotify/transfer_spotify_playback';
import { buildDeviceKeySvg } from './build_device_key_svg';
import { listDeviceChoices } from './list_device_choices';
import type { PlayOnDeviceSettings } from './play_on_device_settings';
import { playOnDeviceSettingsSchema } from './play_on_device_settings_schema';
import type { PlayerStateHub } from './player_state_hub';
import { rememberPickedDevice } from './remember_picked_device';
import { resolveDeviceKey } from './resolve_device_key';
import { runSpotifyAction } from './run_spotify_action';
import { SpotifyDevicesDataSource } from './spotify_devices_data_source';

type DeviceKey = KeyAction<PlayOnDeviceSettings>;
type PlayOnDeviceSendToPluginEvent = Parameters<
	NonNullable<SingletonAction<PlayOnDeviceSettings>['onSendToPlugin']>
>[0];

function readSettings(rawSettings: unknown): PlayOnDeviceSettings {
	const parsed = playOnDeviceSettingsSchema.safeParse(rawSettings);
	return parsed.success ? parsed.data : {};
}

/**
 * Key that moves Spotify playback to the Spotify Connect device picked in its settings (this computer, a phone, a TV...),
 * launching Spotify when it is closed. It shows the device icon and name, lit while that device plays.
 * Its property inspector lists the devices Spotify sees; its refresh button makes Spotify look for devices again.
 */
export class PlayOnDeviceAction extends SingletonAction<PlayOnDeviceSettings> {
	override readonly manifestId = 'com.sonny93.spotify.play-on-device';

	private readonly settings = new Map<string, PlayOnDeviceSettings>();
	private readonly lastImages = new Map<string, string>();
	private knownDevices: readonly SpotifyDevice[] = [];
	private unsubscribe: (() => void) | undefined;

	constructor(private readonly playerStateHub: PlayerStateHub) {
		super();
	}

	override async onWillAppear(
		ev: WillAppearEvent<PlayOnDeviceSettings>
	): Promise<void> {
		if (!ev.action.isKey()) {
			return;
		}
		this.unsubscribe ??= this.playerStateHub.subscribe(() => {
			void this.renderAll();
		});
		this.lastImages.delete(ev.action.id);
		await this.keep(ev.action, readSettings(ev.payload.settings));
	}

	override onWillDisappear(ev: WillDisappearEvent<PlayOnDeviceSettings>): void {
		this.settings.delete(ev.action.id);
		this.lastImages.delete(ev.action.id);
		if (this.settings.size > 0) {
			return;
		}
		this.unsubscribe?.();
		this.unsubscribe = undefined;
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<PlayOnDeviceSettings>
	): Promise<void> {
		if (ev.action.isKey()) {
			await this.keep(ev.action, readSettings(ev.payload.settings));
		}
	}

	override async onKeyDown(
		ev: KeyDownEvent<PlayOnDeviceSettings>
	): Promise<void> {
		const deviceId = this.settings.get(ev.action.id)?.deviceId;
		if (deviceId === undefined || deviceId === '') {
			await ev.action.showAlert();
			return;
		}
		await runSpotifyAction(ev.action, transferSpotifyPlayback(deviceId));
	}

	override async onSendToPlugin(
		ev: PlayOnDeviceSendToPluginEvent
	): Promise<void> {
		const request = SpotifyDevicesDataSource.readRequest(ev.payload);
		if (request === undefined) {
			return;
		}
		let devices: readonly SpotifyDevice[] = [];
		try {
			devices = await runSpotifyQuery(
				listSpotifyDevices({ shouldDiscover: request.isRefresh })
			);
			this.knownDevices = devices;
		} catch (error) {
			streamDeck.logger.warn('Cannot list the Spotify devices', error);
		}
		try {
			const settings = readSettings(await ev.action.getSettings());
			await streamDeck.ui.sendToPropertyInspector({
				event: SpotifyDevicesDataSource.event,
				items: listDeviceChoices({ devices, settings }),
			});
			if (ev.action.isKey()) {
				await this.keep(ev.action, settings);
			}
		} catch (error) {
			streamDeck.logger.error('Cannot send the Spotify devices', error);
		}
	}

	/** Keeps the settings of a key, first copying in the name and kind of its device when Spotify listed it, then redraws the key. */
	private async keep(
		key: DeviceKey,
		settings: PlayOnDeviceSettings
	): Promise<void> {
		const remembered = rememberPickedDevice({
			settings,
			devices: this.knownDevices,
		});
		this.settings.set(key.id, remembered ?? settings);
		if (remembered !== undefined) {
			await key.setSettings(remembered);
		}
		await this.render(key);
	}

	private async renderAll(): Promise<void> {
		await Promise.all(
			this.actions
				.toArray()
				.filter((candidate): candidate is DeviceKey => candidate.isKey())
				.map((key) => this.render(key))
		);
	}

	/** Draws a key, unless its image did not change. */
	private async render(key: DeviceKey): Promise<void> {
		const settings = this.settings.get(key.id);
		if (settings === undefined) {
			return;
		}
		const image = toSvgDataUrl(
			buildDeviceKeySvg(
				resolveDeviceKey({
					settings,
					activeDeviceId: this.playerStateHub.current?.activeDeviceId,
				})
			)
		);
		if (this.lastImages.get(key.id) === image) {
			return;
		}
		this.lastImages.set(key.id, image);
		try {
			await key.setImage(image);
		} catch (error) {
			streamDeck.logger.error('Cannot draw a play on device key', error);
		}
	}
}
