import { SpotifyEndpoint } from './spotify_endpoint';

/** Raised when Spotify never opens its DevTools port after being launched, typically because it already runs without the debug flag. */
export class SpotifyDebugPortUnavailableError extends Error {
	readonly code = 'E_SPOTIFY_DEBUG_PORT_UNAVAILABLE';
	override readonly name = 'SpotifyDebugPortUnavailableError';

	constructor(
		options: Readonly<{ timeoutMilliseconds: number; cause?: unknown }>
	) {
		super(
			`Spotify did not open its DevTools port ${SpotifyEndpoint.debugPort} within ${options.timeoutMilliseconds} ms. ` +
				'It is probably already running without --remote-debugging-port: close Spotify completely ' +
				'(or disable its autostart) so the plugin can restart it with the debug flag.',
			{ cause: options.cause }
		);
	}
}
