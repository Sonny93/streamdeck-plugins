import type { KeyLabel } from 'deck-kit/keys/key_label';

import type { KeyStateValue } from './key_state_value';

/** What a key shows: its state, its icon, and the label drawn under the icon color, `undefined` to keep the images of the manifest. */
export type KeyDescription = Readonly<{
	state: KeyStateValue;
	glyph: (color: string) => string;
	label: KeyLabel | undefined;
}>;
