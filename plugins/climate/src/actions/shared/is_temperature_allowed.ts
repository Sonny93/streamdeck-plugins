import { SETPOINT_RANGES } from '../../daikin/local/setpoint_ranges';
import type { UnitMode } from '../../daikin/unit_types';

/** Tells whether a target temperature can be written in a mode: dry and fan have no setpoint, the others a range. */
export function isTemperatureAllowed(
	mode: UnitMode,
	temperature: number
): boolean {
	const range = SETPOINT_RANGES[mode];
	return (
		range !== undefined &&
		temperature >= range.minimum &&
		temperature <= range.maximum
	);
}
