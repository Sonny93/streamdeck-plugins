import type { CarouselScheduler } from './carousel_scheduler';

/** How long the dials must stay untouched to count as inactive, and the scheduler that measures it. */
export type InactivityMonitorOptions = Readonly<{
	delayMilliseconds: number;
	schedule: CarouselScheduler;
}>;
