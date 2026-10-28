/** Raised when a Spotify internal service is absent from the platform registry. */
export class SpotifyServiceNotFoundError extends Error {
	readonly code = 'E_SPOTIFY_SERVICE_NOT_FOUND';
	override readonly name = 'SpotifyServiceNotFoundError';

	constructor(options: Readonly<{ service: string }>) {
		super(
			`The Spotify internal service "${options.service}" was not found. Spotify may have changed its internals.`
		);
	}
}
