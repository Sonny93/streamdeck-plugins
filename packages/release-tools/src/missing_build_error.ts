/** Raised when a package to ship has not been built yet. */
export class MissingBuildError extends Error {
	readonly code = 'E_MISSING_BUILD';
	override readonly name = 'MissingBuildError';

	constructor(options: Readonly<{ reason: string }>) {
		super(options.reason);
	}
}
