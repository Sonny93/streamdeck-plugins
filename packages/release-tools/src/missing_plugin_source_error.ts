/** Raised when the plugin folder to copy does not exist or holds no manifest. */
export class MissingPluginSourceError extends Error {
	readonly code = 'E_MISSING_PLUGIN_SOURCE';
	override readonly name = 'MissingPluginSourceError';

	constructor(options: Readonly<{ sourceDirectory: string }>) {
		super(
			`No built plugin at ${options.sourceDirectory} (manifest.json missing): run pnpm build first.`
		);
	}
}
