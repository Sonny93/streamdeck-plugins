import type { FanRate, UnitMode } from '../../daikin/unit_types';
import { FanRateNames } from '../shared/fan_rate_names';
import { formatTemperature } from '../shared/format_temperature';
import { UnitModeNames } from '../shared/unit_mode_names';

const FALLBACK_LABEL = 'Préréglage';

/** The label of a "Preset" key that has none typed: its mode and temperature, otherwise its fan rate. */
export function describePresetLabel(
	preset: Readonly<{
		mode: UnitMode | undefined;
		targetTemperature: number | undefined;
		fanRate: FanRate | undefined;
	}>
): string {
	const parts = [
		preset.mode === undefined ? undefined : UnitModeNames[preset.mode],
		preset.targetTemperature === undefined
			? undefined
			: formatTemperature(preset.targetTemperature),
	].filter((part) => part !== undefined);
	if (parts.length > 0) {
		return parts.join(' ');
	}
	return preset.fanRate === undefined
		? FALLBACK_LABEL
		: `Ventil. ${FanRateNames[preset.fanRate]}`;
}
