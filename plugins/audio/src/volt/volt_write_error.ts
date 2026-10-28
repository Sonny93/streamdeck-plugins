/** Raised when a settings report cannot be sent to the Volt 1. */
export class VoltWriteError extends Error {
	readonly code = 'E_VOLT_WRITE_FAILED';
	override readonly name = 'VoltWriteError';

	constructor() {
		super('Cannot send the settings to the Volt 1.');
	}
}
