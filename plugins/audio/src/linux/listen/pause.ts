import type { Scheduler } from 'deck-kit/async/scheduler';

/** Resolves after the delay, on the given scheduler. */
export function pause(
	schedule: Scheduler,
	delayMilliseconds: number
): Promise<void> {
	return new Promise((resolve) => {
		schedule(resolve, delayMilliseconds);
	});
}
