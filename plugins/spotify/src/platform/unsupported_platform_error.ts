/** Raised when the plugin runs on an operating system it has no Spotify host for. */
export class UnsupportedPlatformError extends Error {
	readonly code = 'E_UNSUPPORTED_PLATFORM';
	override readonly name = 'UnsupportedPlatformError';

	constructor(options: Readonly<{ platform: string }>) {
		super(
			`The Spotify plugin supports Windows and Linux, not ${options.platform}.`
		);
	}
}
