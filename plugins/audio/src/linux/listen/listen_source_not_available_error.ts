/** Raised when a source id is not a hardware input of the current listing, so nothing may be set or loaded for it. */
export class ListenSourceNotAvailableError extends Error {
	readonly code = 'E_LISTEN_SOURCE_NOT_AVAILABLE';
	override readonly name = 'ListenSourceNotAvailableError';

	constructor(sourceId: string) {
		super(`The input "${sourceId}" is not available for listening.`);
	}
}
