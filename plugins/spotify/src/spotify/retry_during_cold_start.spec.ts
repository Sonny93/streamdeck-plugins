import { describe, expect, it, vi } from 'vitest';

import { retryDuringColdStart } from './retry_during_cold_start';

class RetryableTestError extends Error {}
class FatalTestError extends Error {}
class TimeoutTestError extends Error {}

const FAST_POLL_INTERVAL_MILLISECONDS = 1;
const SHORT_TIMEOUT_MILLISECONDS = 30;
const GENEROUS_TIMEOUT_MILLISECONDS = 5_000;

function buildFailingThenSucceeding(
	failureCount: number
): () => Promise<string> {
	let remainingFailures = failureCount;
	return () => {
		if (remainingFailures > 0) {
			remainingFailures -= 1;
			return Promise.reject(new RetryableTestError());
		}
		return Promise.resolve('ready');
	};
}

function buildOptions(
	attempt: () => Promise<string>,
	isColdStart: boolean,
	timeoutMilliseconds = GENEROUS_TIMEOUT_MILLISECONDS
) {
	return {
		attempt,
		isColdStart,
		isRetryable: (error: unknown) => error instanceof RetryableTestError,
		createTimeoutError: () => new TimeoutTestError(),
		pollIntervalMilliseconds: FAST_POLL_INTERVAL_MILLISECONDS,
		timeoutMilliseconds,
	};
}

describe('retryDuringColdStart', () => {
	it('should retry until the attempt succeeds when Spotify was just launched', async () => {
		const attempt = vi.fn(buildFailingThenSucceeding(3));

		await retryDuringColdStart(buildOptions(attempt, true));

		expect(attempt).toHaveBeenCalledTimes(4);
	});

	it('should not retry when Spotify was already running', async () => {
		const attempt = vi.fn(buildFailingThenSucceeding(1));

		await expect(
			retryDuringColdStart(buildOptions(attempt, false))
		).rejects.toThrow(RetryableTestError);
	});

	it('should throw the timeout error when the attempt keeps failing past the deadline', async () => {
		const attempt = buildFailingThenSucceeding(Number.POSITIVE_INFINITY);

		await expect(
			retryDuringColdStart(
				buildOptions(attempt, true, SHORT_TIMEOUT_MILLISECONDS)
			)
		).rejects.toThrow(TimeoutTestError);
	});

	it('should rethrow immediately when the error is not retryable', async () => {
		const attempt = vi.fn(() => Promise.reject(new FatalTestError()));

		await expect(
			retryDuringColdStart(buildOptions(attempt, true))
		).rejects.toThrow(FatalTestError);
	});
});
