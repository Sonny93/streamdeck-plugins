/** Raised when an archive is damaged, or uses a zip feature the reader does not support (zip64, encryption, other compression). */
export class ZipReadError extends Error {
	readonly code = 'E_ZIP_READ';
	override readonly name = 'ZipReadError';

	constructor(options: Readonly<{ reason: string }>) {
		super(options.reason);
	}
}
