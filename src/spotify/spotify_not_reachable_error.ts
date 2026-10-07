/** Raised when nothing answers on Spotify's DevTools port. */
export class SpotifyNotReachableError extends Error {
	readonly code = 'E_SPOTIFY_NOT_REACHABLE';
	override readonly name = 'SpotifyNotReachableError';

	constructor(options: Readonly<{ cause?: unknown }> = {}) {
		super('Spotify does not answer on its DevTools port.', {
			cause: options.cause,
		});
	}
}
