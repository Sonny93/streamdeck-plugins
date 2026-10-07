import type { SpotifySession } from './spotify_session';
import { parseClickOutcome } from './parse_click_outcome';
import { evaluateInSpotify } from './evaluate_in_spotify';
import { SpotifyLaunchTiming } from './spotify_launch_timing';
import { buildClickExpression } from './build_click_expression';
import { retryDuringColdStart } from './retry_during_cold_start';
import { SpotifyLaunchTimeoutError } from './spotify_launch_timeout_error';
import { SpotifyElementNotFoundError } from './spotify_element_not_found_error';

async function evaluateClick(
	session: SpotifySession,
	testId: string
): Promise<void> {
	const rawResult = await evaluateInSpotify({
		page: session.page,
		expression: buildClickExpression(testId),
	});
	parseClickOutcome(rawResult, testId);
}

/**
 * Clicks the Spotify element with the given `data-testid`.
 * Right after a cold start the element is awaited until it appears or the launch deadline passes.
 */
export function clickSpotifyElement(
	session: SpotifySession,
	testId: string
): Promise<void> {
	return retryDuringColdStart({
		attempt: () => evaluateClick(session, testId),
		isRetryable: (error) => error instanceof SpotifyElementNotFoundError,
		isColdStart: session.launchedByPlugin,
		createTimeoutError: (lastError) =>
			new SpotifyLaunchTimeoutError({
				waitedFor: `the Spotify element "${testId}"`,
				timeoutMilliseconds: SpotifyLaunchTiming.timeoutMilliseconds,
				cause: lastError,
			}),
	});
}
