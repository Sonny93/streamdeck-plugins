/** Raised when a profile archive or a profile name cannot be imported. */
export class InvalidProfileError extends Error {
	readonly code = 'E_INVALID_PROFILE';
	override readonly name = 'InvalidProfileError';

	constructor(options: Readonly<{ reason: string }>) {
		super(options.reason);
	}
}
