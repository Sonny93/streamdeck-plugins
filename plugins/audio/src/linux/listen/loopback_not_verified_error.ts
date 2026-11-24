export type LoopbackFailure =
	| 'stream-missing'
	| 'wrong-source'
	| 'capture-volume-too-high'
	| 'playback-volume-too-high'
	| 'tag-missing';

/** Raised when a loopback just loaded failed a safety check; it has been unloaded by then. */
export class LoopbackNotVerifiedError extends Error {
	readonly code = 'E_LISTEN_LOOPBACK_NOT_VERIFIED';
	override readonly name = 'LoopbackNotVerifiedError';
	readonly failure: LoopbackFailure;

	constructor(failure: LoopbackFailure) {
		super(
			`The loopback failed its safety check (${failure}) and was unloaded.`
		);
		this.failure = failure;
	}
}
