import type { SpotifySession } from './spotify_session';
import { bringSpotifyToFront } from './bring_spotify_to_front';
import { isProcessInForeground } from '../windows/is_process_in_foreground';
import { readSpotifyBrowserProcessId } from './read_spotify_browser_process_id';

/**
 * Brings Spotify to the foreground only when it is not the OS foreground application.
 * The check is made at the OS level, since `document.hasFocus()` is unreliable in Spotify's CEF.
 * A foreground window is left alone, which avoids a needless minimize/restore flicker.
 */
export async function bringSpotifyToFrontIfUnfocused(
	session: SpotifySession
): Promise<void> {
	const processId = await readSpotifyBrowserProcessId(session);
	if (await isProcessInForeground(processId)) {
		return;
	}
	await bringSpotifyToFront(session);
}
