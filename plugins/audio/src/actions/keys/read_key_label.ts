import type { KeyLabel } from './key_label';
import { keyLabelSettingsSchema } from './key_label_settings_schema';

/**
 * Reads the label a key draws from its raw settings: the text typed in its settings, otherwise the default label of the action.
 * `undefined` when there is neither; the label goes on top unless set below.
 */
export function readKeyLabel(
	rawSettings: unknown,
	defaultText: string | undefined
): KeyLabel | undefined {
	const parsed = keyLabelSettingsSchema.safeParse(rawSettings);
	const settings = parsed.success ? parsed.data : {};
	const typedText = settings.label?.trim();
	const text =
		typedText === undefined || typedText === '' ? defaultText : typedText;
	if (text === undefined) {
		return undefined;
	}
	return {
		text,
		position: settings.labelPosition === 'bottom' ? 'bottom' : 'top',
	};
}
