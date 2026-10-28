import { ensureSpotifyRunning } from './ensure_spotify_running';
import { openSpotifySession } from './open_spotify_session';
import type { SpotifySession } from './spotify_session';

/**
 * Ensures Spotify runs with its DevTools port open (launching it if needed) and opens the CDP connections.
 * The caller must close both clients of the returned session.
 */
export async function connectToSpotify(): Promise<SpotifySession> {
	return openSpotifySession(await ensureSpotifyRunning());
}
