/** Raised when no Volt 1 is plugged in. */
export class VoltNotFoundError extends Error {
	readonly code = 'E_VOLT_NOT_FOUND';
	override readonly name = 'VoltNotFoundError';

	constructor() {
		super('No Volt 1 is plugged in.');
	}
}
