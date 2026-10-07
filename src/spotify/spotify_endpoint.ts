const SPOTIFY_DEBUG_PORT = 9229;
const SPOTIFY_DEBUG_HOST = '127.0.0.1';

/** Location of the Chrome DevTools endpoint exposed by Spotify when launched with `--remote-debugging-port`. */
export const SpotifyEndpoint = {
	debugPort: SPOTIFY_DEBUG_PORT,
	httpBaseUrl: `http://${SPOTIFY_DEBUG_HOST}:${SPOTIFY_DEBUG_PORT}`,
	pageUrlPrefix: 'https://xpui.app.spotify.com/',
	httpTimeoutMilliseconds: 2_000,
} as const;
