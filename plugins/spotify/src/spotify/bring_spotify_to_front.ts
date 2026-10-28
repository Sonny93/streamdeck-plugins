import type { SpotifySession } from './spotify_session';
import { activateProcessWindow } from '../windows/activate_process_window';
import { readSpotifyBrowserProcessId } from './read_spotify_browser_process_id';

/**
 * Brings the Spotify window to the foreground through the OS.
 * CDP window state changes are not honored by Windows' foreground lock, so the native window is activated.
 */
export async function bringSpotifyToFront(
	session: SpotifySession
): Promise<void> {
	await activateProcessWindow(await readSpotifyBrowserProcessId(session));
}
