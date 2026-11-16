import { DaikinError } from '../errors/daikin_error';
import { UnitWriteUnconfirmedError } from '../errors/unit_write_unconfirmed_error';
import type { RawRecord } from '../raw_record';
import type { UnitState } from '../unit_types';
import { mapUnitState } from './map_unit_state';
import { UNIT_PATHS } from './unit_paths';
import type { UnitRequester } from './unit_requester';

/** Re-reads the control info once a write was accepted; a failure leaves the write unconfirmed. */
export async function readStateAfterWrite(
	request: UnitRequester,
	host: string,
	params: RawRecord
): Promise<UnitState> {
	try {
		return mapUnitState(await request(UNIT_PATHS.controlInfo));
	} catch (error) {
		throw error instanceof DaikinError
			? new UnitWriteUnconfirmedError(host, params, { cause: error })
			: error;
	}
}
