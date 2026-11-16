import { evaluateInSpotify } from '../spotify/evaluate_in_spotify';
import { parseEvaluateResult } from '../spotify/parse_evaluate_result';
import type { SpotifySession } from '../spotify/spotify_session';

const HAS_FOCUS_EXPRESSION = 'document.hasFocus()';

/** Asks the Spotify page whether it has the focus, which on Linux needs no window tool. */
export async function isSpotifyPageFocused(
	session: SpotifySession
): Promise<boolean> {
	const value = parseEvaluateResult(
		await evaluateInSpotify({
			page: session.page,
			expression: HAS_FOCUS_EXPRESSION,
		})
	);
	return value === true;
}
