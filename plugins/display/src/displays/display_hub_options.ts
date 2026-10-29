import type { Scheduler } from '../shared/scheduler';
import type { DisplaySystem } from './display_system';

export type DisplayHubOptions = Readonly<{
	loadDisplaySystem: () => Promise<DisplaySystem>;
	schedule: Scheduler;
	pollIntervalMilliseconds: number;
	/** Called when the monitors cannot be read; the hub tries again at the next poll. */
	onError: (error: unknown) => void;
}>;
