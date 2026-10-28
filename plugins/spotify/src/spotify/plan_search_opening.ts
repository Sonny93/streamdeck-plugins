import type { SpotifySearchState } from './spotify_search_state';
import type { SearchOpeningMethod } from './search_opening_method';

/**
 * Decides what the search key does from the page state.
 * An open modal is closed (a second Ctrl+K would not close it); otherwise the shortcut opens it.
 */
export function planSearchOpening(
	state: SpotifySearchState
): SearchOpeningMethod {
	return state.hasModalInput ? 'close-modal' : 'send-shortcut';
}
