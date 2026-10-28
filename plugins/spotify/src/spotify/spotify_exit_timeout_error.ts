/** Raised when Spotify processes are still running after being killed and the exit deadline passed. */
export class SpotifyExitTimeoutError extends Error {
	readonly code = 'E_SPOTIFY_EXIT_TIMEOUT';
	override readonly name = 'SpotifyExitTimeoutError';

	constructor(
		options: Readonly<{ timeoutMilliseconds: number; cause?: unknown }>
	) {
		super(
			`Spotify did not exit within ${options.timeoutMilliseconds} ms after being killed.`,
			{ cause: options.cause }
		);
	}
}
