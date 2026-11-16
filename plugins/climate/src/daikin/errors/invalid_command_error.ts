import { DaikinError } from './daikin_error';

export class InvalidCommandError extends DaikinError {
	readonly code = 'E_INVALID_COMMAND';
}
