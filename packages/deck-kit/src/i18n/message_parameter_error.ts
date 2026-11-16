/** A message was asked for without a value for one of its placeholders. */
export class MessageParameterError extends Error {
	readonly code = 'E_MESSAGE_PARAMETER';

	constructor(key: string, parameter: string) {
		super(`Message "${key}" has no value for "{${parameter}}"`);
		this.name = new.target.name;
	}
}
