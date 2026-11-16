import { streamDeck } from '@elgato/streamdeck';
import { SingletonAction } from '@elgato/streamdeck';
import type {
	DialAction,
	DialDownEvent,
	DialRotateEvent,
	DidReceiveSettingsEvent,
	PropertyInspectorDidAppearEvent,
	TouchTapEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import { scheduleTimeout } from 'deck-kit/async/schedule_timeout';
import { resolveStripColumn } from 'deck-kit/strip/resolve_strip_column';
import { PropertyInspectorReplies } from 'deck-kit/ui/property_inspector_replies';

import type { AudioMixer } from '../audio/audio_mixer';
import type { FrameEncoder } from '../platform/frame_encoder';
import type { SpotifyHost } from '../platform/spotify_host';
import { AudioAppsDataSource } from './audio_apps_data_source';
import { buildVolumeDialSvg } from './build_volume_dial_svg';
import { BusyKeys } from './busy_keys';
import { listAudioAppChoices } from './list_audio_app_choices';
import type { NowPlayingScreen } from './now_playing_screen';
import { ProgressTicker } from './progress_ticker';
import { readVolumeTarget } from './read_volume_target';
import { toDialBackdrop } from './to_dial_backdrop';
import { toNowPlayingDial } from './to_now_playing_dial';
import { VolumeControl } from './volume_control';
import { VolumeController } from './volume_controller';
import type { VolumeDialSettings } from './volume_dial_settings';
import type { VolumeTarget } from './volume_target';

type PropertyInspectorPayload = Parameters<
	typeof streamDeck.ui.sendToPropertyInspector
>[0];
type VolumeDial = DialAction<VolumeDialSettings>;
type VolumeSendToPluginEvent = Parameters<
	NonNullable<SingletonAction<VolumeDialSettings>['onSendToPlugin']>
>[0];

type VolumeSettingsReader = Readonly<{
	id: string;
	getSettings: () => Promise<VolumeDialSettings>;
}>;

const CANVAS_FEEDBACK_KEY = 'canvas';

/**
 * Stream Deck+ dial that controls the volume of one app in the OS mixer: Spotify, the app in the foreground, or an app picked in its settings.
 * Rotate to change the volume (unmuting the app), press the dial or tap the strip to mute or unmute it.
 * The strip shows the app, its volume and its mute state, re-read every second so outside changes and focus changes show up,
 * over the dial's slice of the playing track's cover.
 * While the "now playing" screen shows, the first rotation, press or tap only brings the volume back.
 */
export class VolumeDialAction extends SingletonAction<VolumeDialSettings> {
	override readonly manifestId = 'com.sonny93.spotify.volume';

	private readonly targets = new Map<string, VolumeTarget>();
	private readonly lastSvgs = new Map<string, string>();
	private readonly queues = new Map<string, Promise<void>>();
	private readonly renders = new BusyKeys();
	private readonly controller: VolumeController;
	private readonly ticker: ProgressTicker;

	private readonly replies =
		new PropertyInspectorReplies<PropertyInspectorPayload>({
			readCurrentActionId: () => streamDeck.ui.action?.id,
			sendToCurrent: (payload) =>
				streamDeck.ui.sendToPropertyInspector(payload),
		});

	private readonly mixer: AudioMixer;
	private readonly encodeFrame: FrameEncoder;

	constructor(
		host: SpotifyHost,
		private readonly nowPlaying: NowPlayingScreen
	) {
		super();
		this.mixer = host.audioMixer;
		this.encodeFrame = host.encodeFrame;
		this.controller = new VolumeController(
			host.audioMixer,
			host.spotifyImageName
		);
		this.ticker = new ProgressTicker({
			schedule: scheduleTimeout,
			intervalMilliseconds: VolumeControl.refreshIntervalMilliseconds,
			onTick: () => {
				void this.renderAll();
			},
		});
		nowPlaying.onHidden(() => {
			this.lastSvgs.clear();
			void this.renderAll();
		});
		nowPlaying.onBackdropChanged(() => {
			void this.renderAll();
		});
	}

	override async onWillAppear(
		ev: WillAppearEvent<VolumeDialSettings>
	): Promise<void> {
		if (!ev.action.isDial()) {
			return;
		}
		this.targets.set(ev.action.id, readVolumeTarget(ev.payload.settings));
		this.lastSvgs.delete(ev.action.id);
		this.nowPlaying.attach(toNowPlayingDial(ev.action));
		this.ticker.restart(true);
		await this.render(ev.action);
	}

	override onWillDisappear(ev: WillDisappearEvent<VolumeDialSettings>): void {
		this.targets.delete(ev.action.id);
		this.lastSvgs.delete(ev.action.id);
		this.queues.delete(ev.action.id);
		this.replies.forget(ev.action.id);
		this.nowPlaying.detach(ev.action.id);
		if (this.targets.size === 0) {
			this.ticker.stop();
		}
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<VolumeDialSettings>
	): Promise<void> {
		if (!ev.action.isDial()) {
			return;
		}
		this.targets.set(ev.action.id, readVolumeTarget(ev.payload.settings));
		await this.render(ev.action);
	}

	override onDialRotate(ev: DialRotateEvent<VolumeDialSettings>): void {
		if (this.nowPlaying.wake('other')) {
			return;
		}
		this.enqueue(ev.action, (target) =>
			this.controller.adjust(target, ev.payload.ticks)
		);
	}

	override onDialDown(ev: DialDownEvent<VolumeDialSettings>): void {
		if (this.nowPlaying.wake('press')) {
			return;
		}
		this.enqueue(ev.action, (target) => this.controller.toggleMute(target));
	}

	override onTouchTap(ev: TouchTapEvent<VolumeDialSettings>): void {
		if (this.nowPlaying.wake('other')) {
			return;
		}
		this.enqueue(ev.action, (target) => this.controller.toggleMute(target));
	}

	override async onSendToPlugin(ev: VolumeSendToPluginEvent): Promise<void> {
		if (!AudioAppsDataSource.isRequest(ev.payload)) {
			return;
		}
		await this.answerAppList(ev.action);
	}

	override async onPropertyInspectorDidAppear(
		ev: PropertyInspectorDidAppearEvent<VolumeDialSettings>
	): Promise<void> {
		await this.replies.deliverPending(ev.action.id);
		await this.answerAppList(ev.action);
	}

	private async answerAppList(action: VolumeSettingsReader): Promise<void> {
		try {
			const settings = await action.getSettings();
			const items = listAudioAppChoices({
				apps: await this.mixer.listApps(),
				pickedImageName: settings.appImageName,
			});
			await this.replies.reply({
				actionId: action.id,
				event: AudioAppsDataSource.event,
				payload: { event: AudioAppsDataSource.event, items },
			});
		} catch (error) {
			streamDeck.logger.error('Cannot list the apps playing sound', error);
		}
	}

	/** Runs the changes of one dial one after the other, so fast rotations read the volume the previous tick wrote. */
	private enqueue(
		dial: VolumeDial,
		change: (target: VolumeTarget) => Promise<boolean>
	): void {
		const previous = this.queues.get(dial.id) ?? Promise.resolve();
		const next = previous.then(async () => {
			const target = this.targets.get(dial.id);
			if (target === undefined) {
				return;
			}
			try {
				if (!(await change(target))) {
					await dial.showAlert();
				}
			} catch (error) {
				streamDeck.logger.error('Cannot change the volume', error);
				await dial.showAlert();
			}
			await this.render(dial);
		});
		this.queues.set(dial.id, next);
	}

	private async renderAll(): Promise<void> {
		await Promise.all(
			this.actions
				.toArray()
				.filter(
					(candidate): candidate is VolumeDial =>
						candidate.isDial() && !this.renders.isBusy(candidate.id)
				)
				.map((dial) => this.render(dial))
		);
	}

	/** Draws the volume of a dial, unless the "now playing" screen covers it or the image did not change. */
	private render(dial: VolumeDial): Promise<void> {
		return this.renders.track(dial.id, () => this.draw(dial));
	}

	private async draw(dial: VolumeDial): Promise<void> {
		const target = this.targets.get(dial.id);
		if (target === undefined || this.nowPlaying.isShowing) {
			return;
		}
		try {
			const svg = buildVolumeDialSvg(
				await this.controller.read(target),
				toDialBackdrop(
					this.nowPlaying.backdropCover,
					resolveStripColumn(dial.coordinates)
				)
			);
			if (this.nowPlaying.isShowing || this.lastSvgs.get(dial.id) === svg) {
				return;
			}
			const image = await this.encodeFrame(svg);
			if (image === undefined || this.nowPlaying.isShowing) {
				return;
			}
			this.lastSvgs.set(dial.id, svg);
			await dial.setFeedback({ [CANVAS_FEEDBACK_KEY]: image });
		} catch (error) {
			streamDeck.logger.error('Cannot draw a volume dial', error);
		}
	}
}
