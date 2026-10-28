/** Raised when the profile layout places an action that the plugin manifest does not declare. */
export class UnknownActionError extends Error {
	readonly code = 'E_UNKNOWN_ACTION';
	override readonly name = 'UnknownActionError';

	constructor(options: Readonly<{ actionUuid: string }>) {
		super(
			`The profile layout uses "${options.actionUuid}", which the plugin manifest does not declare.`
		);
	}
}
