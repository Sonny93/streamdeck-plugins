import type { CarouselScheduler } from './carousel_scheduler';

/** The carousel scheduler backed by `setTimeout`. */
export const scheduleTimeout: CarouselScheduler = (
	callback,
	delayMilliseconds
) => {
	const timer = setTimeout(callback, delayMilliseconds);
	return () => {
		clearTimeout(timer);
	};
};
