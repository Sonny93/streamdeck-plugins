import { keyLabelSettingsSchema } from 'deck-kit/keys/key_label_settings_schema';

import type { KeyLabelPreferences } from './key_label_preferences';

/** Reads the label a user typed for a key from its raw settings; invalid settings give no text and the top position. */
export function readKeyLabelPreferences(
	rawSettings: unknown
): KeyLabelPreferences {
	const parsed = keyLabelSettingsSchema.safeParse(rawSettings);
	const settings = parsed.success ? parsed.data : {};
	const typedText = settings.label?.trim();
	return {
		typedText: typedText === '' ? undefined : typedText,
		position: settings.labelPosition === 'bottom' ? 'bottom' : 'top',
	};
}
