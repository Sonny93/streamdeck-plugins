/** Raised when a cover image cannot be downloaded or is not an image. */
export class SpotifyCoverFetchError extends Error {
	readonly code = 'E_SPOTIFY_COVER_FETCH';
	override readonly name = 'SpotifyCoverFetchError';

	constructor(
		options: Readonly<{ url: string; reason: string; cause?: unknown }>
	) {
		super(`Cannot fetch the cover ${options.url}: ${options.reason}`, {
			cause: options.cause,
		});
	}
}
