import { buildCloseSearchModalExpression } from './build_close_search_modal_expression';
import { evaluateInSpotify } from './evaluate_in_spotify';
import { parseCloseSearchModalOutcome } from './parse_close_search_modal_outcome';
import type { SpotifySession } from './spotify_session';

/** Closes the open search modal without bringing Spotify to the front. */
export async function closeSpotifySearchModal(
	session: SpotifySession
): Promise<void> {
	const rawResult = await evaluateInSpotify({
		page: session.page,
		expression: buildCloseSearchModalExpression(),
	});
	parseCloseSearchModalOutcome(rawResult);
}
