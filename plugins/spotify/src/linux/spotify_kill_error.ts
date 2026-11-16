/** Raised when a Spotify process cannot be sent the termination signal. */
export class SpotifyKillError extends Error {
	readonly code = 'E_SPOTIFY_KILL_FAILED';
	override readonly name = 'SpotifyKillError';

	constructor(options: Readonly<{ processId: number; cause: unknown }>) {
		super(`Cannot terminate the Spotify process ${options.processId}.`, {
			cause: options.cause,
		});
	}
}
