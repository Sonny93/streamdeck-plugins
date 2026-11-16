import type { RawRecord } from '../raw_record';
import type { UnitIdentity } from '../unit_types';
import { requireValue } from './require_value';
import { resolveApiFamily } from './resolve_api_family';

export type ParsedBasicInfo = UnitIdentity & { readonly type: string };

/** Shared by `GET /common/basic_info` and the UDP discovery reply. Throws a protocol error without `mac` or `type`. */
export function parseBasicInfo(record: RawRecord): ParsedBasicInfo {
	const type = requireValue(record, 'type');
	return {
		type,
		mac: requireValue(record, 'mac'),
		name: record['name'] ?? '',
		firmwareVersion: (record['ver'] ?? '').replaceAll('_', '.'),
		apiFamily: resolveApiFamily(type),
	};
}
