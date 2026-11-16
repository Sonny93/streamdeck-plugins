import { requireValue } from '../protocol/require_value';
import type { RawRecord } from '../raw_record';

const NO_FAULT = '0';

export function mapFaultCode(sensors: RawRecord): string | null {
	const code = requireValue(sensors, 'err');
	return code === NO_FAULT ? null : code;
}
