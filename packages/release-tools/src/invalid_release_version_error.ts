/** Raised when the repository version is not a plain `X.Y.Z`. */
export class InvalidReleaseVersionError extends Error {
	readonly code = 'E_INVALID_RELEASE_VERSION';
	override readonly name = 'InvalidReleaseVersionError';

	constructor(options: Readonly<{ reason: string }>) {
		super(options.reason);
	}
}
