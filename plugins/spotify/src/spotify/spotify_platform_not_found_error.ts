/** Raised when the Spotify internal platform object cannot be found in the UI page. */
export class SpotifyPlatformNotFoundError extends Error {
	readonly code = 'E_SPOTIFY_PLATFORM_NOT_FOUND';
	override readonly name = 'SpotifyPlatformNotFoundError';

	constructor() {
		super(
			'The Spotify internal platform was not found. Spotify may still be starting, or it may have changed its internals.'
		);
	}
}
