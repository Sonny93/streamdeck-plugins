import type { Scheduler } from './scheduler';

/** The scheduler backed by `setTimeout`. */
export const scheduleTimeout: Scheduler = (callback, delayMilliseconds) => {
	const timer = setTimeout(callback, delayMilliseconds);
	return () => {
		clearTimeout(timer);
	};
};
