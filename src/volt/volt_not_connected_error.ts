/** Raised when a button change is asked while the Volt 1 is not connected. */
export class VoltNotConnectedError extends Error {
	readonly code = 'E_VOLT_NOT_CONNECTED';
	override readonly name = 'VoltNotConnectedError';

	constructor() {
		super('The Volt 1 is not connected.');
	}
}
