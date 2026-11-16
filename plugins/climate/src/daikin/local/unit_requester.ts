import type { RawRecord } from '../raw_record';

export type UnitRequester = (
	path: string,
	query?: RawRecord
) => Promise<RawRecord>;
