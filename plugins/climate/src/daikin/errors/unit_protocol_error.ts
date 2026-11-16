import { DaikinError } from './daikin_error';

export class UnitProtocolError extends DaikinError {
	readonly code = 'E_UNIT_PROTOCOL';
}
