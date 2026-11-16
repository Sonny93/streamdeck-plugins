import type { WritableSpecialMode } from '../../daikin/unit_types';
import type { KeyLabelPreferences } from '../shared/key_label_preferences';

/** What a "Special mode" key switches, and what the user typed for its label. */
export type SpecialModeConfig = Readonly<{
	mode: WritableSpecialMode;
	label: KeyLabelPreferences;
}>;
