import type { SpotifySession } from './spotify_session';
import { parseBrowserProcessId } from './parse_browser_process_id';

/** Reads the id of Spotify's browser process, which owns its main window. */
export async function readSpotifyBrowserProcessId(
	session: SpotifySession
): Promise<number> {
	const rawResult = await session.browser.send('SystemInfo.getProcessInfo');
	return parseBrowserProcessId(rawResult);
}
