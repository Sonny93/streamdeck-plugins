export type LoopbackFailure =
	| 'stream-missing'
	| 'stream-unlinked'
	| 'wrong-source'
	| 'capture-volume-too-high'
	| 'playback-volume-too-high'
	| 'tag-missing';

/** Raised when a loopback just loaded failed a safety check; it has been unloaded by then. */
export class LoopbackNotVerifiedError extends Error {
	readonly code = 'E_LISTEN_LOOPBACK_NOT_VERIFIED';
	override readonly name = 'LoopbackNotVerifiedError';
	readonly failure: LoopbackFailure;
	/** What the last read showed (`linked to <source>`, `source index 4294967295`), when it helps to tell why. */
	readonly observed: string | undefined;

	constructor(failure: LoopbackFailure, observed?: string) {
		super(
			`The loopback failed its safety check (${failure}${observed === undefined ? '' : `: ${observed}`}) and was unloaded.`
		);
		this.failure = failure;
		this.observed = observed;
	}
}
