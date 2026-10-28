/** Raised when a Spotify UI element is absent from the DOM. */
export class SpotifyElementNotFoundError extends Error {
	readonly code = 'E_SPOTIFY_ELEMENT_NOT_FOUND';
	override readonly name = 'SpotifyElementNotFoundError';

	constructor(options: Readonly<{ testId: string }>) {
		super(
			`Spotify element with data-testid "${options.testId}" was not found.`
		);
	}
}
