/** Raised when the Stream Deck CLI fails to pack a plugin. */
export class PackCommandError extends Error {
	readonly code = 'E_PACK_COMMAND';
	override readonly name = 'PackCommandError';

	constructor(options: Readonly<{ reason: string }>) {
		super(options.reason);
	}
}
