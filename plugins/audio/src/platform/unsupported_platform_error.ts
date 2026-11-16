/** Raised by the adapters of a system the plugin does not support, so every feature fails cleanly. */
export class UnsupportedPlatformError extends Error {
	readonly code = 'E_UNSUPPORTED_PLATFORM';
	override readonly name = 'UnsupportedPlatformError';

	constructor(platform: string) {
		super(`The audio plugin does not support the platform "${platform}".`);
	}
}
