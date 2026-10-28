/** Raised when an operation needs the playing track but Spotify has none loaded. */
export class SpotifyNoCurrentTrackError extends Error {
	readonly code = 'E_SPOTIFY_NO_CURRENT_TRACK';
	override readonly name = 'SpotifyNoCurrentTrackError';

	constructor() {
		super('Spotify has no current track.');
	}
}
