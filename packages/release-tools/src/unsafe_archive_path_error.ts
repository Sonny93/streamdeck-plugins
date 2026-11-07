/** Raised when an archive entry would be written outside the folder it is extracted into. */
export class UnsafeArchivePathError extends Error {
	readonly code = 'E_UNSAFE_ARCHIVE_PATH';
	override readonly name = 'UnsafeArchivePathError';

	constructor(options: Readonly<{ entryName: string }>) {
		super(`Unsafe path in the archive: ${JSON.stringify(options.entryName)}`);
	}
}
