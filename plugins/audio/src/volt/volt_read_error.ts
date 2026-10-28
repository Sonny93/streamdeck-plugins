/** Raised when the Volt 1 stops answering reads, usually because it was unplugged. */
export class VoltReadError extends Error {
	readonly code = 'E_VOLT_READ_FAILED';
	override readonly name = 'VoltReadError';

	constructor() {
		super('Cannot read from the Volt 1, it was probably unplugged.');
	}
}
