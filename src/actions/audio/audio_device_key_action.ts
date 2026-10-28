import type {
	DidReceiveSettingsEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';

import { readKeyLabel } from '../keys/read_key_label';
import { AudioDeviceAction } from './audio_device_action';
import { DrawnKeyImages } from '../keys/drawn_key_images';
import type { KeyAppearance } from '../keys/key_appearance';
import type { AudioTarget } from '../../audio/audio_target';
import type { KeyStateValue } from '../keys/key_state_value';
import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioDeviceSettings } from './audio_device_settings';

/**
 * Base of the audio device keys: each shows a state and draws its label, typed in its settings or the default one of the action,
 * in the color of its icon.
 */
export abstract class AudioDeviceKeyAction extends AudioDeviceAction {
	/** Label drawn while none is typed in the settings, `undefined` to keep the manifest images. */
	protected abstract readonly defaultLabel: string | undefined;
	private readonly images = new DrawnKeyImages();

	override async onWillAppear(
		ev: WillAppearEvent<AudioDeviceSettings>
	): Promise<void> {
		this.images.setLabel(
			ev.action.id,
			readKeyLabel(ev.payload.settings, this.defaultLabel)
		);
		await super.onWillAppear(ev);
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<AudioDeviceSettings>
	): Promise<void> {
		this.images.setLabel(
			ev.action.id,
			readKeyLabel(ev.payload.settings, this.defaultLabel)
		);
		await super.onDidReceiveSettings(ev);
	}

	override onWillDisappear(ev: WillDisappearEvent<AudioDeviceSettings>): void {
		this.images.forget(ev.action.id);
		super.onWillDisappear(ev);
	}

	protected abstract resolveKeyState(
		snapshot: AudioSnapshot | undefined,
		target: AudioTarget | undefined
	): KeyStateValue;

	protected abstract appearanceOf(state: KeyStateValue): KeyAppearance;

	protected override async render(
		keyAction: WillAppearEvent<AudioDeviceSettings>['action'],
		target: AudioTarget | undefined,
		snapshot: AudioSnapshot | undefined
	): Promise<void> {
		if (!keyAction.isKey()) {
			return;
		}
		const state = this.resolveKeyState(snapshot, target);
		await keyAction.setState(state);
		await this.images.draw(keyAction, this.appearanceOf(state));
	}
}
