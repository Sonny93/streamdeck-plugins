/** Raised when a manifest has no `Version` field to set. */
export class ManifestVersionError extends Error {
	readonly code = 'E_MANIFEST_VERSION';
	override readonly name = 'ManifestVersionError';

	constructor(options: Readonly<{ reason: string }>) {
		super(options.reason);
	}
}
