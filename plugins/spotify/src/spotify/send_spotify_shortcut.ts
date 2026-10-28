import type { SpotifySession } from './spotify_session';
import type { SpotifyShortcut } from './spotify_shortcut';
import { buildShortcutKeyEvent } from './build_shortcut_key_event';

/**
 * Presses and releases a shortcut inside the Spotify page.
 * It goes through CDP, so it needs no OS input and no OS focus.
 */
export async function sendSpotifyShortcut(
	session: SpotifySession,
	shortcut: SpotifyShortcut
): Promise<void> {
	await session.page.send(
		'Input.dispatchKeyEvent',
		buildShortcutKeyEvent(shortcut, 'rawKeyDown')
	);
	await session.page.send(
		'Input.dispatchKeyEvent',
		buildShortcutKeyEvent(shortcut, 'keyUp')
	);
}
