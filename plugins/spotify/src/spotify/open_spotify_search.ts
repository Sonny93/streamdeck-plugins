import { SpotifyShortcuts } from './spotify_shortcuts';
import type { SpotifySession } from './spotify_session';
import { planSearchOpening } from './plan_search_opening';
import { sendSpotifyShortcut } from './send_spotify_shortcut';
import { readSpotifySearchState } from './read_spotify_search_state';
import { closeSpotifySearchModal } from './close_spotify_search_modal';
import { focusSpotifySearchInput } from './focus_spotify_search_input';
import { bringSpotifyToFrontIfUnfocused } from './bring_spotify_to_front_if_unfocused';

/**
 * Toggles Spotify's search modal.
 * An open modal is closed without bringing Spotify to the front. Otherwise the window is brought
 * to the front when the page lacks focus, then Ctrl+K opens the modal.
 * After a cold start the input is awaited, since the shortcut handler may not be ready yet.
 */
export async function openSpotifySearch(
	session: SpotifySession
): Promise<void> {
	const method = planSearchOpening(await readSpotifySearchState(session));
	if (method === 'close-modal') {
		await closeSpotifySearchModal(session);
		return;
	}
	await bringSpotifyToFrontIfUnfocused(session);
	await sendSpotifyShortcut(session, SpotifyShortcuts.openSearch);
	if (session.launchedByPlugin) {
		await focusSpotifySearchInput(session);
	}
}
