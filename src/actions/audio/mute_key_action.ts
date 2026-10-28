import { action } from '@elgato/streamdeck';
import type { KeyDownEvent } from '@elgato/streamdeck';

import { KeyState } from '../keys/key_state';
import { KeyPalette } from '../keys/key_palette';
import { microphoneGlyph } from '../keys/microphone_glyph';
import type { KeyAppearance } from '../keys/key_appearance';
import type { AudioTarget } from '../../audio/audio_target';
import type { KeyStateValue } from '../keys/key_state_value';
import { resolveMuteKeyState } from './resolve_mute_key_state';
import type { AudioSnapshot } from '../../audio/audio_snapshot';
import { AudioDeviceKeyAction } from './audio_device_key_action';
import type { AudioDeviceChoices } from './audio_device_choices';
import type { AudioDeviceSettings } from './audio_device_settings';
import { mutedMicrophoneGlyph } from '../keys/muted_microphone_glyph';

const APPEARANCES: Readonly<Record<KeyStateValue, KeyAppearance>> = {
	[KeyState.off]: { glyph: microphoneGlyph, color: KeyPalette.active },
	[KeyState.on]: { glyph: mutedMicrophoneGlyph, color: KeyPalette.alert },
	[KeyState.unavailable]: {
		glyph: microphoneGlyph,
		color: KeyPalette.unavailable,
	},
};

/**
 * Key that mutes or unmutes its device, the default input unless another one is picked.
 * The microphone is amber while live and red, struck through, while muted.
 */
@action({ UUID: 'com.sonny93.audio.mute' })
export class MuteKeyAction extends AudioDeviceKeyAction {
	protected override readonly fallbackTarget: AudioTarget | undefined = {
		kind: 'default',
		flow: 'input',
	};
	protected override readonly defaultLabel: string | undefined = 'Micro';
	protected override readonly choices: AudioDeviceChoices = {
		event: 'listAudioDevices',
		flows: ['input', 'output'],
		offersDefaults: true,
	};

	override async onKeyDown(
		ev: KeyDownEvent<AudioDeviceSettings>
	): Promise<void> {
		await this.runChange(ev.action, (target) => this.hub.toggleMute(target));
	}

	protected override resolveKeyState(
		snapshot: AudioSnapshot | undefined,
		target: AudioTarget | undefined
	): KeyStateValue {
		return resolveMuteKeyState(snapshot, target);
	}

	protected override appearanceOf(state: KeyStateValue): KeyAppearance {
		return APPEARANCES[state];
	}
}
