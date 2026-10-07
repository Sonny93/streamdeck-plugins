/** Raised when a freshly launched Spotify does not become ready before the deadline. */
export class SpotifyLaunchTimeoutError extends Error {
	readonly code = 'E_SPOTIFY_LAUNCH_TIMEOUT';
	override readonly name = 'SpotifyLaunchTimeoutError';

	constructor(
		options: Readonly<{
			waitedFor: string;
			timeoutMilliseconds: number;
			cause?: unknown;
		}>
	) {
		super(
			`Timed out after ${options.timeoutMilliseconds} ms waiting for ${options.waitedFor}.`,
			{
				cause: options.cause,
			}
		);
	}
}
