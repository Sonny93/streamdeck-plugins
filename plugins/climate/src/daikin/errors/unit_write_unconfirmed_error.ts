import type { RawRecord } from '../raw_record';
import { DaikinError } from './daikin_error';

/** The outcome of a write is unknown: the caller must re-read the unit before deciding anything. */
export class UnitWriteUnconfirmedError extends DaikinError {
	readonly code = 'E_UNIT_WRITE_UNCONFIRMED';
	readonly sentParams: RawRecord;

	constructor(host: string, sentParams: RawRecord, options?: ErrorOptions) {
		super(`Write to unit ${host} is unconfirmed`, options);
		this.sentParams = sentParams;
	}
}
