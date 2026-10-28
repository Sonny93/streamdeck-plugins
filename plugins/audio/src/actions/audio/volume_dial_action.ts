import { action } from '@elgato/streamdeck';
import type {
	DialDownEvent,
	DialRotateEvent,
	TouchTapEvent,
	WillAppearEvent,
} from '@elgato/streamdeck';

import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioTarget } from '../../audio/audio_target';
import { AudioDeviceAction } from './audio_device_action';
import type { AudioDeviceChoices } from './audio_device_choices';
import type { AudioDeviceSettings } from './audio_device_settings';
import { buildVolumeDialFeedback } from './build_volume_dial_feedback';

/**
 * Stream Deck+ dial for the volume of its device, the default output unless another one is picked.
 * Rotate to change the volume (unmuting the device), press the dial or tap the strip to mute or unmute it.
 */
@action({ UUID: 'com.sonny93.audio.volume' })
export class VolumeDialAction extends AudioDeviceAction {
	protected override readonly fallbackTarget: AudioTarget | undefined = {
		kind: 'default',
		flow: 'output',
	};
	protected override readonly choices: AudioDeviceChoices = {
		event: 'listAudioDevices',
		flows: ['output', 'input'],
		offersDefaults: true,
	};

	override async onDialRotate(
		ev: DialRotateEvent<AudioDeviceSettings>
	): Promise<void> {
		await this.runChange(ev.action, (target) =>
			this.hub.changeVolume(target, ev.payload.ticks)
		);
	}

	override async onDialDown(
		ev: DialDownEvent<AudioDeviceSettings>
	): Promise<void> {
		await this.runChange(ev.action, (target) => this.hub.toggleMute(target));
	}

	override async onTouchTap(
		ev: TouchTapEvent<AudioDeviceSettings>
	): Promise<void> {
		await this.runChange(ev.action, (target) => this.hub.toggleMute(target));
	}

	protected override async render(
		dialAction: WillAppearEvent<AudioDeviceSettings>['action'],
		target: AudioTarget | undefined,
		snapshot: AudioSnapshot | undefined
	): Promise<void> {
		if (dialAction.isDial() && target !== undefined) {
			await dialAction.setFeedback(buildVolumeDialFeedback(snapshot, target));
		}
	}
}
