import { AudioTargetValues } from './audio_target_values';
import type { AudioTarget } from '../../audio/audio_target';
import { audioDeviceSettingsSchema } from './audio_device_settings_schema';

/** Reads the device an action works on from its raw settings; missing or invalid settings fall back to the action default. */
export function readAudioTarget(
	rawSettings: unknown,
	fallback: AudioTarget | undefined
): AudioTarget | undefined {
	const parsed = audioDeviceSettingsSchema.safeParse(rawSettings);
	const value = parsed.success ? parsed.data.device?.trim() : undefined;
	switch (value) {
		case undefined:
		case '':
			return fallback;
		case AudioTargetValues.defaultOutput:
			return { kind: 'default', flow: 'output' };
		case AudioTargetValues.defaultInput:
			return { kind: 'default', flow: 'input' };
		default:
			return { kind: 'device', deviceId: value };
	}
}
