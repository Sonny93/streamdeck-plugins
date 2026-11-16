import type { SpotifyHost } from '../platform/spotify_host';
import { readSpotifyBrowserProcessId } from './read_spotify_browser_process_id';
import type { SpotifySession } from './spotify_session';

/**
 * Brings the Spotify window to the foreground through the OS.
 * CDP window state changes are not honored by Windows' foreground lock, so the native window is activated.
 */
export async function bringSpotifyToFront(
	session: SpotifySession,
	host: SpotifyHost
): Promise<void> {
	await host.activateWindow(await readSpotifyBrowserProcessId(session));
}
