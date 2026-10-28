import { buildPlatformExpression } from './build_platform_expression';
import { evaluateInSpotify } from './evaluate_in_spotify';
import { parsePlatformOutcome } from './parse_platform_outcome';
import { retryDuringColdStart } from './retry_during_cold_start';
import { SpotifyLaunchTimeoutError } from './spotify_launch_timeout_error';
import { SpotifyLaunchTiming } from './spotify_launch_timing';
import { SpotifyPlatformNotFoundError } from './spotify_platform_not_found_error';
import type { SpotifySession } from './spotify_session';

async function evaluatePlatformScript(
	session: SpotifySession,
	body: string
): Promise<unknown> {
	const rawResult = await evaluateInSpotify({
		page: session.page,
		expression: buildPlatformExpression(body),
	});
	return parsePlatformOutcome(rawResult);
}

/**
 * Runs `body` inside Spotify with access to its internal platform services and returns the value it produced.
 * Right after a cold start the platform is awaited until it appears or the launch deadline passes.
 */
export function runPlatformScript(
	session: SpotifySession,
	body: string
): Promise<unknown> {
	return retryDuringColdStart({
		attempt: () => evaluatePlatformScript(session, body),
		isRetryable: (error) => error instanceof SpotifyPlatformNotFoundError,
		isColdStart: session.launchedByPlugin,
		createTimeoutError: (lastError) =>
			new SpotifyLaunchTimeoutError({
				waitedFor: 'the Spotify platform',
				timeoutMilliseconds: SpotifyLaunchTiming.timeoutMilliseconds,
				cause: lastError,
			}),
	});
}
