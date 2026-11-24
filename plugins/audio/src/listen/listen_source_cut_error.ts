import type { ListenCutReason } from './listen_cut_reason';

/** Reported when listening to a source was stopped for safety, so a loud level never reaches the headphones. */
export class ListenSourceCutError extends Error {
	readonly code = 'E_LISTEN_SOURCE_CUT';
	override readonly name = 'ListenSourceCutError';

	constructor(
		readonly sourceId: string,
		readonly reason: ListenCutReason,
		options?: ErrorOptions
	) {
		super(`Listening to ${sourceId} was cut: ${reason}.`, options);
	}
}
