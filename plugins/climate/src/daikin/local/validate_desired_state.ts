import { InvalidCommandError } from '../errors/invalid_command_error';
import type { DesiredUnitState, UnitMode } from '../unit_types';
import { SETPOINT_RANGES } from './setpoint_ranges';

const TEMPERATURE_LESS_MODES: readonly UnitMode[] = ['dry', 'fan'];
const TEMPERATURE_STEPS_PER_DEGREE = 2;

function assertWithinRange(
	temperature: number,
	effectiveMode: UnitMode | undefined
): void {
	const range =
		effectiveMode === undefined ? undefined : SETPOINT_RANGES[effectiveMode];
	if (range === undefined) return;
	if (temperature >= range.minimum && temperature <= range.maximum) return;
	throw new InvalidCommandError(
		`Target temperature ${temperature} is outside ${range.minimum}..${range.maximum} in ${effectiveMode} mode`
	);
}

/** Refuses what must never be sent. `effectiveMode` is the mode the unit will be in after the write, when known. */
export function validateDesiredState(
	desired: Readonly<DesiredUnitState>,
	effectiveMode: UnitMode | undefined
): void {
	const temperature = desired.targetTemperature;
	if (temperature === undefined || temperature === null) return;
	if (
		!Number.isFinite(temperature) ||
		!Number.isInteger(temperature * TEMPERATURE_STEPS_PER_DEGREE)
	) {
		throw new InvalidCommandError(
			`Target temperature ${temperature} is not a multiple of 0.5`
		);
	}
	if (
		effectiveMode !== undefined &&
		TEMPERATURE_LESS_MODES.includes(effectiveMode)
	) {
		throw new InvalidCommandError(
			`Mode ${effectiveMode} has no target temperature`
		);
	}
	assertWithinRange(temperature, effectiveMode);
}
