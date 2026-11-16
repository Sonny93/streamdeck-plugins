/** Raised when a command runs before the plugin has loaded the host of its operating system. */
export class SpotifyHostNotLoadedError extends Error {
	readonly code = 'E_SPOTIFY_HOST_NOT_LOADED';
	override readonly name = 'SpotifyHostNotLoadedError';

	constructor() {
		super('The Spotify host is not loaded yet.');
	}
}
