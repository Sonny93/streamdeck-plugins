/** Raised when a profile holds an action that the profile filter cannot handle, such as a multi action. */
export class UnsupportedProfileActionError extends Error {
	readonly code = 'E_UNSUPPORTED_PROFILE_ACTION';
	override readonly name = 'UnsupportedProfileActionError';

	constructor(options: Readonly<{ pluginUuid: string }>) {
		super(
			`The profile holds a ${options.pluginUuid} action, which is not supported because it nests actions of other plugins`
		);
	}
}
