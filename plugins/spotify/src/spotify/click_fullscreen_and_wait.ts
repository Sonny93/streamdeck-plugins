import type { SpotifySession } from './spotify_session';
import { evaluateInSpotify } from './evaluate_in_spotify';
import { SpotifyLaunchTiming } from './spotify_launch_timing';
import { retryDuringColdStart } from './retry_during_cold_start';
import { SpotifyLaunchTimeoutError } from './spotify_launch_timeout_error';
import { SpotifyElementNotFoundError } from './spotify_element_not_found_error';
import { parseFullscreenToggleOutcome } from './parse_fullscreen_toggle_outcome';
import { buildFullscreenToggleExpression } from './build_fullscreen_toggle_expression';

async function evaluateToggle(session: SpotifySession): Promise<void> {
	const rawResult = await evaluateInSpotify({
		page: session.page,
		expression: buildFullscreenToggleExpression(),
	});
	parseFullscreenToggleOutcome(rawResult);
}

/**
 * Clicks the full screen button and waits, page-side, for the `fullscreenchange` event or its timeout.
 * Right after a cold start the button is awaited until it appears or the launch deadline passes.
 */
export function clickFullscreenAndWait(session: SpotifySession): Promise<void> {
	return retryDuringColdStart({
		attempt: () => evaluateToggle(session),
		isRetryable: (error) => error instanceof SpotifyElementNotFoundError,
		isColdStart: session.launchedByPlugin,
		createTimeoutError: (lastError) =>
			new SpotifyLaunchTimeoutError({
				waitedFor: 'the Spotify full screen button',
				timeoutMilliseconds: SpotifyLaunchTiming.timeoutMilliseconds,
				cause: lastError,
			}),
	});
}
