/** Raised when the plugin runs on an operating system it has no monitor adapter for. */
export class UnsupportedPlatformError extends Error {
	readonly code = 'E_UNSUPPORTED_PLATFORM';
	override readonly name = 'UnsupportedPlatformError';

	constructor(options: Readonly<{ platform: string }>) {
		super(`The display plugin does not support ${options.platform}.`);
	}
}
