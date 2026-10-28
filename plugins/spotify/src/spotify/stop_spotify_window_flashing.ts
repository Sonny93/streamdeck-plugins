import { stopWindowFlashing } from '../windows/stop_window_flashing';
import { readSpotifyBrowserProcessId } from './read_spotify_browser_process_id';
import type { SpotifySession } from './spotify_session';

/** Stops the taskbar flashing of Spotify's main window, which Windows starts when it cannot take focus. */
export async function stopSpotifyWindowFlashing(
	session: SpotifySession
): Promise<void> {
	await stopWindowFlashing(await readSpotifyBrowserProcessId(session));
}
