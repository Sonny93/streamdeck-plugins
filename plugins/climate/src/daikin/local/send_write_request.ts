import { DaikinError } from '../errors/daikin_error';
import { UnitRejectedError } from '../errors/unit_rejected_error';
import { UnitUnreachableError } from '../errors/unit_unreachable_error';
import { UnitWriteUnconfirmedError } from '../errors/unit_write_unconfirmed_error';
import type { RawRecord } from '../raw_record';
import type { UnitRequester } from './unit_requester';

function isOutcomeKnown(error: unknown): boolean {
	if (error instanceof UnitRejectedError) return true;
	return error instanceof UnitUnreachableError && !error.mayHaveReachedUnit;
}

function toUnconfirmed(
	host: string,
	sentParams: RawRecord,
	error: unknown
): unknown {
	if (!(error instanceof DaikinError) || isOutcomeKnown(error)) return error;
	return new UnitWriteUnconfirmedError(host, sentParams, { cause: error });
}

/** Sends one write; a failure whose outcome is unknown becomes an unconfirmed error carrying the sent params. */
export async function sendWriteRequest(
	request: UnitRequester,
	host: string,
	path: string,
	params: RawRecord
): Promise<void> {
	try {
		await request(path, params);
	} catch (error) {
		throw toUnconfirmed(host, params, error);
	}
}
