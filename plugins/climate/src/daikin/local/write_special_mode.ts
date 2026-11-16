import type { UnitState, WritableSpecialMode } from '../unit_types';
import { RAW_CODES } from './raw_codes';
import { readStateAfterWrite } from './read_state_after_write';
import { sendWriteRequest } from './send_write_request';
import { UNIT_PATHS } from './unit_paths';
import type { UnitRequester } from './unit_requester';

/** SET, GET sequence; the caller holds the host lock. */
export async function writeSpecialMode(
	request: UnitRequester,
	host: string,
	mode: WritableSpecialMode,
	isActive: boolean
): Promise<UnitState> {
	const params = {
		set_spmode: isActive ? '1' : '0',
		spmode_kind: RAW_CODES.kindBySpecialMode[mode],
	};
	await sendWriteRequest(request, host, UNIT_PATHS.setSpecialMode, params);
	return readStateAfterWrite(request, host, params);
}
