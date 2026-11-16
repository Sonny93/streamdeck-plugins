import type { DesiredUnitState, UnitState } from '../unit_types';
import { buildSetParams } from './build_set_params';
import { readStateAfterWrite } from './read_state_after_write';
import { sendWriteRequest } from './send_write_request';
import { UNIT_PATHS } from './unit_paths';
import type { UnitRequester } from './unit_requester';
import { validateDesiredState } from './validate_desired_state';

/** GET, SET, GET sequence; the caller holds the host lock. */
export async function writeUnitState(
	request: UnitRequester,
	host: string,
	desired: Readonly<DesiredUnitState>
): Promise<UnitState> {
	validateDesiredState(desired, desired.mode);
	const params = buildSetParams(await request(UNIT_PATHS.controlInfo), desired);
	await sendWriteRequest(request, host, UNIT_PATHS.setControlInfo, params);
	return readStateAfterWrite(request, host, params);
}
