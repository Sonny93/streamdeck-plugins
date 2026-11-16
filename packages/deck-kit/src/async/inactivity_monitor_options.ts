import type { Scheduler } from './scheduler';

/** How long the dials must stay untouched to count as inactive, and the scheduler that measures it. */
export type InactivityMonitorOptions = Readonly<{
	delayMilliseconds: number;
	schedule: Scheduler;
}>;
