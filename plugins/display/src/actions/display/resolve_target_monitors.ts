import type { DisplaySnapshot } from '../../displays/display_snapshot';
import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import type { MonitorTarget } from './monitor_target';

/** Finds the monitors an action works on; empty while the monitors cannot be read or the picked one is not lit. */
export function resolveTargetMonitors(
	snapshot: DisplaySnapshot | undefined,
	target: MonitorTarget
): readonly MonitorSnapshot[] {
	const monitors = snapshot?.monitors ?? [];
	switch (target.kind) {
		case 'all':
			return monitors;
		case 'primary':
			return monitors.filter((monitor) => monitor.isPrimary).slice(0, 1);
		case 'monitor':
			return monitors.filter((monitor) => monitor.id === target.monitorId);
	}
}
