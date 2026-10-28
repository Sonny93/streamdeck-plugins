/** Raised when the DevTools HTTP endpoint answers with an unexpected status or payload. */
export class SpotifyInvalidResponseError extends Error {
	readonly code = 'E_SPOTIFY_INVALID_RESPONSE';
	override readonly name = 'SpotifyInvalidResponseError';

	constructor(options: Readonly<{ reason: string; cause?: unknown }>) {
		super(`Invalid DevTools response: ${options.reason}`, {
			cause: options.cause,
		});
	}
}
