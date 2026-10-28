import { action } from '@elgato/streamdeck';
import type { KeyDownEvent, WillAppearEvent } from '@elgato/streamdeck';

import { AudioDeviceAction } from './audio_device_action';
import type { AudioTarget } from '../../audio/audio_target';
import { resolveMuteKeyState } from './resolve_mute_key_state';
import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioDeviceChoices } from './audio_device_choices';
import type { AudioDeviceSettings } from './audio_device_settings';

/** Key that mutes or unmutes its device, the default input unless another one is picked, showing whether it is muted. */
@action({ UUID: 'com.sonny93.audio.mute' })
export class MuteKeyAction extends AudioDeviceAction {
	protected override readonly fallbackTarget: AudioTarget | undefined = {
		kind: 'default',
		flow: 'input',
	};
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

	protected override async render(
		keyAction: WillAppearEvent<AudioDeviceSettings>['action'],
		target: AudioTarget | undefined,
		snapshot: AudioSnapshot | undefined
	): Promise<void> {
		if (keyAction.isKey()) {
			await keyAction.setState(resolveMuteKeyState(snapshot, target));
		}
	}
}
