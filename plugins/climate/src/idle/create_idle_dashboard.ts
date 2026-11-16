import type { InactivityMonitor } from 'deck-kit/async/inactivity_monitor';
import type { Scheduler } from 'deck-kit/async/scheduler';
import { IdlePanel } from 'deck-kit/strip/idle_panel';

import type { ClimateHub } from '../climate/climate_hub';
import { buildDashboardSvg } from './build_dashboard_svg';

/**
 * The idle dashboard of the plugin: the state of the air conditioner across the whole touch strip while the Stream Deck is inactive.
 * It is available only while the unit is ready, and follows the view of the hub.
 */
export function createIdleDashboard(
	options: Readonly<{
		inactivity: Pick<
			InactivityMonitor,
			'isInactive' | 'subscribe' | 'recordActivity'
		>;
		schedule: Scheduler;
		hub: Pick<ClimateHub, 'view' | 'subscribe'>;
		onError: (error: unknown) => void;
	}>
): IdlePanel {
	const { hub } = options;
	return new IdlePanel({
		inactivity: options.inactivity,
		schedule: options.schedule,
		isAvailable: () => hub.view.status === 'ready',
		subscribe: (listener) => hub.subscribe(listener),
		buildSlice: (column) => buildDashboardSvg(hub.view, column),
		onError: options.onError,
	});
}
