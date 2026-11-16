import type { KeyLabel } from 'deck-kit/keys/key_label';

import type { FanRate, UnitMode } from '../../daikin/unit_types';

/**
 * What a "Preset" key does, read from its settings: the mode, temperature and fan rate it sets (each optional, at least one),
 * and its label. `invalid` when the settings cannot be applied, which dims the key.
 */
export type PresetConfig =
	| Readonly<{
			kind: 'valid';
			mode: UnitMode | undefined;
			targetTemperature: number | undefined;
			fanRate: FanRate | undefined;
			label: KeyLabel;
	  }>
	| Readonly<{ kind: 'invalid' }>;
