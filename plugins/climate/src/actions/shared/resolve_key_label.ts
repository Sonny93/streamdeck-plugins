import type { KeyLabel } from 'deck-kit/keys/key_label';

import type { KeyLabelPreferences } from './key_label_preferences';

/** The label a key draws: the text the user typed, otherwise the default text of the key in the language. */
export function resolveKeyLabel(
	preferences: KeyLabelPreferences,
	defaultText: string
): KeyLabel {
	return {
		text: preferences.typedText ?? defaultText,
		position: preferences.position,
	};
}
