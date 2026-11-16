import type { RawRecord } from '../raw_record';

const VALID_MODES: readonly string[] = ['0', '1', '2', '3', '4', '6', '7'];
const NON_NUMERIC_TEMPERATURES: readonly string[] = ['M', '--'];
const MINIMUM_TEMPERATURE = 10;
const MAXIMUM_TEMPERATURE = 32;
const NO_SWING = '0';

type SetParams = {
	readonly pow: string;
	readonly mode: string;
	readonly stemp: string;
	readonly shum: string;
	readonly f_rate: string;
	readonly f_dir: string;
};

function readSetParams(params: RawRecord): SetParams | null {
	const { pow, mode, stemp, shum, f_rate, f_dir } = params;
	if (
		pow === undefined ||
		mode === undefined ||
		stemp === undefined ||
		shum === undefined ||
		f_rate === undefined ||
		f_dir === undefined
	) {
		return null;
	}
	return { pow, mode, stemp, shum, f_rate, f_dir };
}

function isValidTemperature(stemp: string): boolean {
	if (NON_NUMERIC_TEMPERATURES.includes(stemp)) return true;
	const value = Number(stemp);
	return (
		stemp.trim() !== '' &&
		value >= MINIMUM_TEMPERATURE &&
		value <= MAXIMUM_TEMPERATURE
	);
}

function isSwingSupported(modelInfo: RawRecord): boolean {
	return modelInfo['en_fdir'] !== '0' && modelInfo['s_fdir'] !== '0';
}

function resolveMemoryKey(mode: string): string {
	return mode === '0' ? '1' : mode;
}

/**
 * assumed: the 6-param rule (any missing param is `PARAM NG`), `PARAM NG` on an invalid mode
 * or stemp (`M` and `--` accepted, numeric within 10..32), memorization of `dtN/dhN/dfrN/dfdN`
 * for the written mode (raw mode 0 memorized as 1), `f_dir` normalized to `0` when the model
 * info says swing is unsupported. Returns the new control info, or null for `PARAM NG`.
 */
export function applySetControlInfo(
	control: RawRecord,
	modelInfo: RawRecord,
	params: RawRecord
): RawRecord | null {
	const set = readSetParams(params);
	if (set === null) return null;
	if (!VALID_MODES.includes(set.mode) || !isValidTemperature(set.stemp))
		return null;
	const fanDirection = isSwingSupported(modelInfo) ? set.f_dir : NO_SWING;
	const memoryKey = resolveMemoryKey(set.mode);
	return {
		...control,
		pow: set.pow,
		mode: set.mode,
		stemp: set.stemp,
		shum: set.shum,
		f_rate: set.f_rate,
		f_dir: fanDirection,
		[`dt${memoryKey}`]: set.stemp,
		[`dh${memoryKey}`]: set.shum,
		[`dfr${memoryKey}`]: set.f_rate,
		[`dfd${memoryKey}`]: fanDirection,
	};
}
