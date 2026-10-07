/** Raised while polling when Spotify processes are still alive after being killed. */
export class SpotifyStillRunningError extends Error {
	readonly code = 'E_SPOTIFY_STILL_RUNNING';
	override readonly name = 'SpotifyStillRunningError';

	constructor() {
		super('Spotify processes are still running.');
	}
}
