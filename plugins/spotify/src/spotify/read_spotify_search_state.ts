import type { SpotifySession } from './spotify_session';
import { parseSearchState } from './parse_search_state';
import { evaluateInSpotify } from './evaluate_in_spotify';
import type { SpotifySearchState } from './spotify_search_state';
import { buildSearchStateExpression } from './build_search_state_expression';

/** Reads, in one evaluation, whether the page has focus and whether the search modal input exists. */
export async function readSpotifySearchState(
	session: SpotifySession
): Promise<SpotifySearchState> {
	const rawResult = await evaluateInSpotify({
		page: session.page,
		expression: buildSearchStateExpression(),
	});
	return parseSearchState(rawResult);
}
