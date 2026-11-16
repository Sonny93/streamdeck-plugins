import type { SpotifyHost } from '../platform/spotify_host';
import { retryDuringColdStart } from './retry_during_cold_start';
import { SpotifyExitTimeoutError } from './spotify_exit_timeout_error';
import { SpotifyLaunchTiming } from './spotify_launch_timing';
import { SpotifyStillRunningError } from './spotify_still_running_error';

async function failWhileSpotifyRuns(host: SpotifyHost): Promise<void> {
	if (await host.isSpotifyRunning()) {
		throw new SpotifyStillRunningError();
	}
}

function isStillRunning(error: unknown): boolean {
	return error instanceof SpotifyStillRunningError;
}

/** Polls until no Spotify process is left, failing with a typed error when they outlive the exit deadline. */
export function waitForSpotifyExit(host: SpotifyHost): Promise<void> {
	return retryDuringColdStart({
		attempt: () => failWhileSpotifyRuns(host),
		isRetryable: isStillRunning,
		isColdStart: true,
		timeoutMilliseconds: SpotifyLaunchTiming.exitTimeoutMilliseconds,
		createTimeoutError: (lastError) =>
			new SpotifyExitTimeoutError({
				timeoutMilliseconds: SpotifyLaunchTiming.exitTimeoutMilliseconds,
				cause: lastError,
			}),
	});
}
