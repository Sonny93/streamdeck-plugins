import { fetchBrowserWebSocketUrl } from './fetch_browser_web_socket_url';
import { openSpotifySession } from './open_spotify_session';
import type { SpotifySession } from './spotify_session';

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
