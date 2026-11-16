import type { RawRecord } from '../raw_record';

export function serializeWireRecord(ret: string, record: RawRecord): string {
	const entries = Object.entries(record).map(
		([key, value]) => `${key}=${value}`
	);
	return [`ret=${ret}`, ...entries].join(',');
}
