import type { KeyLabel } from './key_label';
import { audioDeviceSettingsSchema } from './audio_device_settings_schema';

/** Reads the label a key should draw from its raw settings, `undefined` when it has none; the label goes on top unless set below. */
export function readKeyLabel(rawSettings: unknown): KeyLabel | undefined {
	const parsed = audioDeviceSettingsSchema.safeParse(rawSettings);
	const text = parsed.success ? parsed.data.label?.trim() : undefined;
	if (text === undefined || text === '' || !parsed.success) {
		return undefined;
	}
	return {
		text,
		position: parsed.data.labelPosition === 'bottom' ? 'bottom' : 'top',
	};
}
