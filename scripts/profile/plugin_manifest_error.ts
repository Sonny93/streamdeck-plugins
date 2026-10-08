/** Raised when the plugin manifest cannot be read or does not have the expected shape. */
export class PluginManifestError extends Error {
	readonly code = 'E_PLUGIN_MANIFEST';
	override readonly name = 'PluginManifestError';

	constructor(options: Readonly<{ reason: string; cause?: unknown }>) {
		super(`Invalid plugin manifest: ${options.reason}`, {
			cause: options.cause,
		});
	}
}
