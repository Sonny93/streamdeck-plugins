import type { KeyLabel } from 'deck-kit/keys/key_label';

import type { WritableSpecialMode } from '../../daikin/unit_types';

/** What a "Special mode" key switches, and its label. */
export type SpecialModeConfig = Readonly<{
	mode: WritableSpecialMode;
	label: KeyLabel;
}>;
