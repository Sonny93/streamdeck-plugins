import type { FanRate, UnitMode } from '../../daikin/unit_types';
import type { KeyLabelPreferences } from '../shared/key_label_preferences';

/**
 * What a "Preset" key does, read from its settings: the mode, temperature and fan rate it sets (each optional, at least one),
 * and what the user typed for its label. `invalid` when the settings cannot be applied, which dims the key.
 */
export type PresetConfig =
	| Readonly<{
			kind: 'valid';
			mode: UnitMode | undefined;
			targetTemperature: number | undefined;
			fanRate: FanRate | undefined;
			label: KeyLabelPreferences;
	  }>
	| Readonly<{ kind: 'invalid' }>;
