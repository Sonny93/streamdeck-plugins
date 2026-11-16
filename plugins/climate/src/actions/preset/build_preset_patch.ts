import type { DesiredUnitState } from '../../daikin/unit_types';
import type { PresetConfig } from './preset_config';

/**
 * The change a "Preset" key sends. With a mode it also turns the unit on; without one it only sets the temperature
 * and the fan rate in the mode the unit is in, and leaves the power as it is.
 */
export function buildPresetPatch(
	config: Extract<PresetConfig, { kind: 'valid' }>
): DesiredUnitState {
	return {
		...(config.mode === undefined
			? {}
			: { isPowered: true, mode: config.mode }),
		...(config.targetTemperature === undefined
			? {}
			: { targetTemperature: config.targetTemperature }),
		...(config.fanRate === undefined ? {} : { fanRate: config.fanRate }),
	};
}
