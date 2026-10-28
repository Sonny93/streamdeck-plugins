import { buildFocusExpression } from './build_focus_expression';
import { evaluateInSpotify } from './evaluate_in_spotify';
import { parseFocusOutcome } from './parse_focus_outcome';
import { retryDuringColdStart } from './retry_during_cold_start';
import { SpotifyElementNotFoundError } from './spotify_element_not_found_error';
import { SpotifyLaunchTimeoutError } from './spotify_launch_timeout_error';
import { SpotifyLaunchTiming } from './spotify_launch_timing';
import type { SpotifySession } from './spotify_session';
import { SpotifyTestIds } from './spotify_test_ids';

async function evaluateFocus(session: SpotifySession): Promise<void> {
	const rawResult = await evaluateInSpotify({
		page: session.page,
		expression: buildFocusExpression(SpotifyTestIds.searchModalInput),
	});
	parseFocusOutcome(rawResult, SpotifyTestIds.searchModalInput);
}

/**
 * Focuses the search modal input.
 * Right after a cold start the input is awaited until it appears or the launch deadline passes.
 */
export function focusSpotifySearchInput(
	session: SpotifySession
): Promise<void> {
	return retryDuringColdStart({
		attempt: () => evaluateFocus(session),
		isRetryable: (error) => error instanceof SpotifyElementNotFoundError,
		isColdStart: session.launchedByPlugin,
		createTimeoutError: (lastError) =>
			new SpotifyLaunchTimeoutError({
				waitedFor: 'the Spotify search input',
				timeoutMilliseconds: SpotifyLaunchTiming.timeoutMilliseconds,
				cause: lastError,
			}),
	});
}
