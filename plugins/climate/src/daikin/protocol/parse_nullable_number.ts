import { UnitProtocolError } from '../errors/unit_protocol_error';

const ABSENT_MARKERS: readonly string[] = ['-', '--'];

/** `-` and `--` mean the value is absent. */
export function parseNullableNumber(key: string, raw: string): number | null {
	if (ABSENT_MARKERS.includes(raw)) return null;
	const value = Number(raw);
	if (raw.trim() === '' || !Number.isFinite(value)) {
		throw new UnitProtocolError(`Value "${raw}" of "${key}" is not a number`);
	}
	return value;
}
