import { SpotifyTestIds } from './spotify_test_ids';
import type { SpotifySession } from './spotify_session';
import { parseFocusOutcome } from './parse_focus_outcome';
import { evaluateInSpotify } from './evaluate_in_spotify';
import { SpotifyLaunchTiming } from './spotify_launch_timing';
import { buildFocusExpression } from './build_focus_expression';
import { retryDuringColdStart } from './retry_during_cold_start';
import { SpotifyLaunchTimeoutError } from './spotify_launch_timeout_error';
import { SpotifyElementNotFoundError } from './spotify_element_not_found_error';

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
