import type { Scheduler } from 'deck-kit/async/scheduler';

import type { UnitDriver } from '../daikin/unit_driver';

export type ClimateHubOptions = Readonly<{
	createDriver: (host: string) => UnitDriver;
	schedule: Scheduler;
	pollIntervalMilliseconds: number;
	maximumPollIntervalMilliseconds: number;
	energyIntervalMilliseconds: number;
	/** How long to wait before reading the energy again after a failed read. */
	energyRetryMilliseconds: number;
	now: () => number;
	onError: (error: unknown) => void;
}>;
