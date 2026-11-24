/** Raised when a listening level is not a finite number. */
export class InvalidListenLevelError extends Error {
	readonly code = 'E_LISTEN_LEVEL_INVALID';
	override readonly name = 'InvalidListenLevelError';

	constructor() {
		super('The listening level is not a number.');
	}
}
