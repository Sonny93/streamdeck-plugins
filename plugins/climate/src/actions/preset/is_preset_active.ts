import type { UnitState } from '../../daikin/unit_types';
import type { PresetConfig } from './preset_config';

/** Tells whether the unit is on and every field a preset sets already has the value of the preset. */
export function isPresetActive(
	state: UnitState,
	config: Extract<PresetConfig, { kind: 'valid' }>
): boolean {
	return (
		state.isPowered &&
		(config.mode === undefined || state.mode === config.mode) &&
		(config.targetTemperature === undefined ||
			state.targetTemperature === config.targetTemperature) &&
		(config.fanRate === undefined || state.fanRate === config.fanRate)
	);
}
