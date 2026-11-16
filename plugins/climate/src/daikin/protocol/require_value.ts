import { UnitProtocolError } from '../errors/unit_protocol_error';
import type { RawRecord } from '../raw_record';

export function requireValue(record: RawRecord, key: string): string {
	const value = record[key];
	if (value === undefined) {
		throw new UnitProtocolError(`Missing expected key "${key}"`);
	}
	return value;
}
