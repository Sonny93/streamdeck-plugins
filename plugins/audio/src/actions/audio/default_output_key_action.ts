import type { KeyDownEvent } from '@elgato/streamdeck';
import type { KeyAppearance } from 'deck-kit/keys/key_appearance';

import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioTarget } from '../../audio/audio_target';
import type { KeyStateValue } from '../keys/key_state_value';
import { speakerGlyph } from '../keys/speaker_glyph';
import { toggleKeyAppearance } from '../keys/toggle_key_appearance';
import type { AudioDeviceChoices } from './audio_device_choices';
import { AudioDeviceKeyAction } from './audio_device_key_action';
import type { AudioDeviceSettings } from './audio_device_settings';
import { resolveDefaultOutputKeyState } from './resolve_default_output_key_state';

/** Key that makes its device the default output of Windows (every role), lit while it is; it has no default label. */
export class DefaultOutputKeyAction extends AudioDeviceKeyAction {
	override readonly manifestId = 'com.sonny93.audio.default-output';

	protected override readonly fallbackTarget: AudioTarget | undefined =
		undefined;
	protected override readonly defaultLabel: string | undefined = undefined;
	protected override readonly choices: AudioDeviceChoices = {
		event: 'listOutputDevices',
		flows: ['output'],
		offersDefaults: false,
	};

	override async onKeyDown(
		ev: KeyDownEvent<AudioDeviceSettings>
	): Promise<void> {
		await this.runChange(ev.action, (target) =>
			this.hub.setDefaultDevice(target)
		);
	}

	protected override resolveKeyState(
		snapshot: AudioSnapshot | undefined,
		target: AudioTarget | undefined
	): KeyStateValue {
		return resolveDefaultOutputKeyState(snapshot, target);
	}

	protected override appearanceOf(state: KeyStateValue): KeyAppearance {
		return toggleKeyAppearance(speakerGlyph, state);
	}
}
