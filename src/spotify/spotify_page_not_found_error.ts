/** Raised when no Spotify UI page target is exposed by the DevTools endpoint. */
export class SpotifyPageNotFoundError extends Error {
	readonly code = 'E_SPOTIFY_PAGE_NOT_FOUND';
	override readonly name = 'SpotifyPageNotFoundError';

	constructor() {
		super('No Spotify UI page target was found on the DevTools endpoint.');
	}
}
