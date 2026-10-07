/** Raised when JavaScript evaluated inside Spotify throws or returns an unexpected value. */
export class SpotifyEvaluationError extends Error {
	readonly code = 'E_SPOTIFY_EVALUATION';
	override readonly name = 'SpotifyEvaluationError';

	constructor(options: Readonly<{ reason: string; cause?: unknown }>) {
		super(`Spotify script evaluation failed: ${options.reason}`, {
			cause: options.cause,
		});
	}
}
