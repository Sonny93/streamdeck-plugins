import type {
	DidReceiveSettingsEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import type { Language } from 'deck-kit/i18n/language';
import type { KeyAppearance } from 'deck-kit/keys/key_appearance';

import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioTarget } from '../../audio/audio_target';
import type { KeyStateValue } from '../keys/key_state_value';
import { LocalizedKeyImages } from '../keys/localized_key_images';
import { AudioDeviceAction } from './audio_device_action';
import type { AudioDeviceSettings } from './audio_device_settings';

/**
 * Base of the audio device keys: each shows a state and draws its label, typed in its settings or the default one of the action,
 * in the color of its icon.
 */
export abstract class AudioDeviceKeyAction extends AudioDeviceAction {
	private readonly images = new LocalizedKeyImages((language) =>
		this.defaultLabel(language)
	);

	/** Label drawn while none is typed in the settings, `undefined` to keep the manifest images. */
	protected abstract defaultLabel(language: Language): string | undefined;

	override async onWillAppear(
		ev: WillAppearEvent<AudioDeviceSettings>
	): Promise<void> {
		this.images.keep(
			ev.action.id,
			ev.payload.settings,
			this.languageStore.current
		);
		await super.onWillAppear(ev);
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<AudioDeviceSettings>
	): Promise<void> {
		this.images.keep(
			ev.action.id,
			ev.payload.settings,
			this.languageStore.current
		);
		await super.onDidReceiveSettings(ev);
	}

	override onWillDisappear(ev: WillDisappearEvent<AudioDeviceSettings>): void {
		this.images.forget(ev.action.id);
		super.onWillDisappear(ev);
	}

	protected override onLanguageChange(): void {
		this.images.relabel(this.languageStore.current);
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
