import { InvalidCommandError } from '../errors/invalid_command_error';
import { requireValue } from '../protocol/require_value';
import type { RawRecord } from '../raw_record';
import type { DesiredUnitState, UnitMode } from '../unit_types';
import { lookupCode } from './lookup_code';
import { RAW_CODES } from './raw_codes';
import { validateDesiredState } from './validate_desired_state';

const ABSENT_PARAM = '--';
const TEMPERATURE_FRACTION_DIGITS = 1;

type ModeParams = {
	readonly mode: string;
	readonly stemp: string;
	readonly shum: string;
	readonly f_rate: string;
	readonly f_dir: string;
};

function encodeCode<TDomain>(
	table: ReadonlyMap<TDomain, string>,
	name: string,
	value: TDomain
): string {
	const raw = table.get(value);
	if (raw === undefined) {
		throw new InvalidCommandError(`Unsupported ${name} "${String(value)}"`);
	}
	return raw;
}

function keepCurrentParams(control: RawRecord): ModeParams {
	return {
		mode: requireValue(control, 'mode'),
		stemp: requireValue(control, 'stemp'),
		shum: requireValue(control, 'shum'),
		f_rate: requireValue(control, 'f_rate'),
		f_dir: requireValue(control, 'f_dir'),
	};
}

function useMemorizedParams(
	control: RawRecord,
	targetMode: UnitMode
): ModeParams {
	const mode = encodeCode(RAW_CODES.rawByMode, 'mode', targetMode);
	return {
		mode,
		stemp: control[`dt${mode}`] ?? ABSENT_PARAM,
		shum: control[`dh${mode}`] ?? ABSENT_PARAM,
		f_rate: control[`dfr${mode}`] ?? requireValue(control, 'f_rate'),
		f_dir: control[`dfd${mode}`] ?? requireValue(control, 'f_dir'),
	};
}

function resolvePower(
	control: RawRecord,
	desired: Readonly<DesiredUnitState>
): string {
	if (desired.isPowered === undefined) return requireValue(control, 'pow');
	return desired.isPowered ? '1' : '0';
}

function resolveTemperature(
	base: string,
	desired: Readonly<DesiredUnitState>
): string {
	const temperature = desired.targetTemperature;
	if (temperature === undefined || temperature === null) return base;
	return temperature.toFixed(TEMPERATURE_FRACTION_DIGITS);
}

/**
 * Merges the desired patch onto the raw `get_control_info` so unmodelled raw values
 * (auto codes 0/1/7, `stemp=M`, `shum=AUTO`) survive untouched. Returns the 6 params of `set_control_info`.
 */
export function buildSetParams(
	control: RawRecord,
	desired: Readonly<DesiredUnitState>
): RawRecord {
	const currentMode = lookupCode(
		RAW_CODES.modeByRaw,
		'mode',
		requireValue(control, 'mode')
	);
	const requestedMode = desired.mode ?? currentMode;
	validateDesiredState(desired, requestedMode);
	const base =
		requestedMode === currentMode
			? keepCurrentParams(control)
			: useMemorizedParams(control, requestedMode);
	return {
		pow: resolvePower(control, desired),
		mode: base.mode,
		stemp: resolveTemperature(base.stemp, desired),
		shum: base.shum,
		f_rate:
			desired.fanRate === undefined
				? base.f_rate
				: encodeCode(RAW_CODES.rawByFanRate, 'fan rate', desired.fanRate),
		f_dir:
			desired.fanDirection === undefined
				? base.f_dir
				: encodeCode(
						RAW_CODES.rawByFanDirection,
						'fan direction',
						desired.fanDirection
					),
	};
}
