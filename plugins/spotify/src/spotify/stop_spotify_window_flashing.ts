import type { SpotifyHost } from '../platform/spotify_host';
import { readSpotifyBrowserProcessId } from './read_spotify_browser_process_id';
import type { SpotifySession } from './spotify_session';

/** Stops the taskbar flashing of Spotify's main window, which some desktops start when it cannot take focus. */
export async function stopSpotifyWindowFlashing(
	session: SpotifySession,
	host: SpotifyHost
): Promise<void> {
	await host.stopWindowFlashing(await readSpotifyBrowserProcessId(session));
}
