import { isTemperatureAllowed } from '../shared/is_temperature_allowed';
import { readKeyLabelPreferences } from '../shared/read_key_label_preferences';
import type { PresetConfig } from './preset_config';
import { presetSettingsSchema } from './preset_settings_schema';

const INVALID: PresetConfig = { kind: 'invalid' };

/**
 * Reads the settings of a "Preset" key. They are invalid when a value is wrong, when nothing is set,
 * or when the temperature does not fit the mode of the preset (outside its range, or a mode with no setpoint).
 * Without a mode, the temperature is checked against the mode of the unit when the key is drawn.
 */
export function readPresetConfig(rawSettings: unknown): PresetConfig {
	const parsed = presetSettingsSchema.safeParse(rawSettings);
	if (!parsed.success) {
		return INVALID;
	}
	const { mode, temperature: targetTemperature, fanRate } = parsed.data;
	if (
		mode === undefined &&
		targetTemperature === undefined &&
		fanRate === undefined
	) {
		return INVALID;
	}
	if (
		mode !== undefined &&
		targetTemperature !== undefined &&
		!isTemperatureAllowed(mode, targetTemperature)
	) {
		return INVALID;
	}
	return {
		kind: 'valid',
		mode,
		targetTemperature,
		fanRate,
		label: readKeyLabelPreferences(rawSettings),
	};
}
