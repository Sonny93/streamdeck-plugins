import { setTimeout as sleep } from 'node:timers/promises';

import { SpotifyLaunchTiming } from './spotify_launch_timing';

type RetryOptions<TResult> = Readonly<{
	attempt: () => Promise<TResult>;
	isRetryable: (error: unknown) => boolean;
	isColdStart: boolean;
	createTimeoutError: (lastError: unknown) => Error;
	pollIntervalMilliseconds?: number;
	timeoutMilliseconds?: number;
}>;

async function pollUntilReady<TResult>(
	options: RetryOptions<TResult>
): Promise<TResult> {
	const intervalMilliseconds =
		options.pollIntervalMilliseconds ??
		SpotifyLaunchTiming.pollIntervalMilliseconds;
	const deadline =
		Date.now() +
		(options.timeoutMilliseconds ?? SpotifyLaunchTiming.timeoutMilliseconds);
	for (;;) {
		try {
			return await options.attempt();
		} catch (error) {
			if (!options.isRetryable(error)) {
				throw error;
			}
			if (Date.now() + intervalMilliseconds > deadline) {
				throw options.createTimeoutError(error);
			}
			await sleep(intervalMilliseconds);
		}
	}
}

/**
 * Runs `attempt` once when Spotify was already running.
 * After a cold start it polls until `attempt` succeeds, a non-retryable error occurs, or the deadline passes.
 */
export function retryDuringColdStart<TResult>(
	options: RetryOptions<TResult>
): Promise<TResult> {
	if (!options.isColdStart) {
		return options.attempt();
	}
	return pollUntilReady(options);
}
