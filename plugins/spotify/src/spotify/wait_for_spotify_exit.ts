import { isProcessImageRunning } from '../windows/is_process_image_running';
import { retryDuringColdStart } from './retry_during_cold_start';
import { SpotifyExitTimeoutError } from './spotify_exit_timeout_error';
import { SpotifyLaunchTiming } from './spotify_launch_timing';
import { SpotifyProcess } from './spotify_process';
import { SpotifyStillRunningError } from './spotify_still_running_error';

async function failWhileSpotifyRuns(): Promise<void> {
	if (await isProcessImageRunning(SpotifyProcess.imageName)) {
		throw new SpotifyStillRunningError();
	}
}

function isStillRunning(error: unknown): boolean {
	return error instanceof SpotifyStillRunningError;
}

/** Polls until no Spotify process is left, failing with a typed error when they outlive the exit deadline. */
export function waitForSpotifyExit(): Promise<void> {
	return retryDuringColdStart({
		attempt: failWhileSpotifyRuns,
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
