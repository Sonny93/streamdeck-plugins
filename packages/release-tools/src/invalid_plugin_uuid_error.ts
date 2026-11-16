/** Raised when a plugin uuid does not match the expected `com.sonny93.<name>` shape. */
export class InvalidPluginUuidError extends Error {
	readonly code = 'E_INVALID_PLUGIN_UUID';
	override readonly name = 'InvalidPluginUuidError';

	constructor(options: Readonly<{ pluginUuid: string }>) {
		super(`Invalid plugin uuid: ${options.pluginUuid}`);
	}
}
