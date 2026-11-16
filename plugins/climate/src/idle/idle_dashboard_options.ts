import type { InactivityMonitor } from 'deck-kit/async/inactivity_monitor';

import type { ClimateHub } from '../climate/climate_hub';

/** What the idle dashboard reads: the inactivity of the dials, the view of the unit, and who to tell about failures. */
export type IdleDashboardOptions = Readonly<{
	inactivity: Pick<
		InactivityMonitor,
		'isInactive' | 'subscribe' | 'recordActivity'
	>;
	hub: Pick<ClimateHub, 'view' | 'subscribe'>;
	onError: (error: unknown) => void;
}>;
