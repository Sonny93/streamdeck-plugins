import type { ClimateView } from '../../climate/climate_view';
import type { KeyDescription } from '../keys/key_description';
import { KeyState } from '../keys/key_state';
import { presetGlyph } from '../keys/preset_glyph';
import { isTemperatureAllowed } from '../shared/is_temperature_allowed';
import { readReadyState } from '../shared/read_ready_state';
import { isPresetActive } from './is_preset_active';
import type { PresetConfig } from './preset_config';

const UNAVAILABLE: KeyDescription = {
	state: KeyState.unavailable,
	glyph: presetGlyph,
	label: undefined,
};

/**
 * A "Preset" key lit while the unit matches it. It is dimmed while the unit is not ready, when its settings are invalid,
 * and when a preset with no mode has a temperature the current mode of the unit cannot take.
 */
export function describePresetKey(
	view: ClimateView,
	config: PresetConfig
): KeyDescription {
	const state = readReadyState(view);
	if (state === undefined || config.kind === 'invalid') {
		return UNAVAILABLE;
	}
	if (
		config.mode === undefined &&
		config.targetTemperature !== undefined &&
		!isTemperatureAllowed(state.mode, config.targetTemperature)
	) {
		return UNAVAILABLE;
	}
	return {
		state: isPresetActive(state, config) ? KeyState.on : KeyState.off,
		glyph: presetGlyph,
		label: config.label,
	};
}
