import type { ClimateHub } from '../climate/climate_hub';
import type { InactivityMonitor } from './inactivity_monitor';

/** What the idle dashboard reads: the inactivity of the dials, the view of the unit, and who to tell about failures. */
export type IdleDashboardOptions = Readonly<{
	inactivity: Pick<
		InactivityMonitor,
		'isInactive' | 'subscribe' | 'recordActivity'
	>;
	hub: Pick<ClimateHub, 'view' | 'subscribe'>;
	onError: (error: unknown) => void;
}>;
