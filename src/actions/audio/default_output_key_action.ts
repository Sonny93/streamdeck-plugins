import { action } from '@elgato/streamdeck';
import type {
	DidReceiveSettingsEvent,
	KeyDownEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';

import { KeyPalette } from './key_palette';
import type { KeyLabel } from './key_label';
import { speakerGlyph } from './speaker_glyph';
import { readKeyLabel } from './read_key_label';
import { AudioDeviceAction } from './audio_device_action';
import type { AudioTarget } from '../../audio/audio_target';
import { toSvgDataUrl } from '../../shared/to_svg_data_url';
import { buildLabeledKeySvg } from './build_labeled_key_svg';
import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioDeviceChoices } from './audio_device_choices';
import type { AudioDeviceSettings } from './audio_device_settings';
import { resolveDefaultOutputKeyState } from './resolve_default_output_key_state';

/**
 * Key that makes its device the default output of Windows (every role), lit while it is.
 * With a label in its settings, the plugin draws the key itself so the label takes the color of the icon.
 */
@action({ UUID: 'com.sonny93.audio.default-output' })
export class DefaultOutputKeyAction extends AudioDeviceAction {
	protected override readonly fallbackTarget: AudioTarget | undefined =
		undefined;
	protected override readonly choices: AudioDeviceChoices = {
		event: 'listOutputDevices',
		flows: ['output'],
		offersDefaults: false,
	};
	private readonly labels = new Map<string, KeyLabel | undefined>();
	/** Image last sent to each key, `undefined` for the manifest images; a key missing here has been sent nothing yet. */
	private readonly lastImages = new Map<string, string | undefined>();

	override async onWillAppear(
		ev: WillAppearEvent<AudioDeviceSettings>
	): Promise<void> {
		this.readSettings(ev.action.id, ev.payload.settings);
		await super.onWillAppear(ev);
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<AudioDeviceSettings>
	): Promise<void> {
		this.readSettings(ev.action.id, ev.payload.settings);
		await super.onDidReceiveSettings(ev);
	}

	override onWillDisappear(ev: WillDisappearEvent<AudioDeviceSettings>): void {
		this.labels.delete(ev.action.id);
		this.lastImages.delete(ev.action.id);
		super.onWillDisappear(ev);
	}

	override async onKeyDown(
		ev: KeyDownEvent<AudioDeviceSettings>
	): Promise<void> {
		await this.runChange(ev.action, (target) =>
			this.hub.setDefaultDevice(target)
		);
	}

	protected override async render(
		keyAction: WillAppearEvent<AudioDeviceSettings>['action'],
		target: AudioTarget | undefined,
		snapshot: AudioSnapshot | undefined
	): Promise<void> {
		if (!keyAction.isKey()) {
			return;
		}
		const state = resolveDefaultOutputKeyState(snapshot, target);
		await keyAction.setState(state);
		const label = this.labels.get(keyAction.id);
		const image =
			label === undefined
				? undefined
				: toSvgDataUrl(
						buildLabeledKeySvg({
							glyph: speakerGlyph,
							color: KeyPalette.byState[state],
							label,
						})
					);
		if (
			this.lastImages.has(keyAction.id) &&
			this.lastImages.get(keyAction.id) === image
		) {
			return;
		}
		this.lastImages.set(keyAction.id, image);
		await keyAction.setImage(image);
	}

	/** Keeps the label of a key and forgets its last image, so the next render sends it again. */
	private readSettings(actionId: string, settings: unknown): void {
		this.labels.set(actionId, readKeyLabel(settings));
		this.lastImages.delete(actionId);
	}
}
