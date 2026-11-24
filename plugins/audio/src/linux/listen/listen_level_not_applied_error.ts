/** Raised when a read after setting the volume of a source still shows a channel above the requested level. */
export class ListenLevelNotAppliedError extends Error {
	readonly code = 'E_LISTEN_LEVEL_NOT_APPLIED';
	override readonly name = 'ListenLevelNotAppliedError';

	constructor(sourceId: string) {
		super(
			`The volume of the input "${sourceId}" did not reach the requested level.`
		);
	}
}
