import type { SpotifySession } from './spotify_session';
import { openSpotifySession } from './open_spotify_session';
import { fetchBrowserWebSocketUrl } from './fetch_browser_web_socket_url';

/**
 * Opens the CDP connections to an already running Spotify, and never launches it.
 * Rejects with `SpotifyNotReachableError` when Spotify's DevTools port is closed.
 * The caller must close both clients of the returned session.
 */
export async function connectToRunningSpotify(): Promise<SpotifySession> {
	return openSpotifySession({
		browserWebSocketUrl: await fetchBrowserWebSocketUrl(),
		launchedByPlugin: false,
	});
}
