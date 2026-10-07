/** Raised when the Spotify executable cannot be started. */
export class SpotifyLaunchFailedError extends Error {
	readonly code = 'E_SPOTIFY_LAUNCH_FAILED';
	override readonly name = 'SpotifyLaunchFailedError';

	constructor(options: Readonly<{ reason: string; cause?: unknown }>) {
		super(`Cannot launch Spotify: ${options.reason}`, { cause: options.cause });
	}
}
