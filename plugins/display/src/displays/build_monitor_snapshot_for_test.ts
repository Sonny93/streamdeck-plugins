import type { MonitorSnapshot } from './monitor_snapshot';

/** Builds the state of a lit SDR monitor with DDC/CI, for tests; any field can be replaced. */
export function buildMonitorSnapshotForTest(
	overrides: Readonly<Partial<MonitorSnapshot>> = {}
): MonitorSnapshot {
	return {
		id: 'monitor',
		name: 'PL2530H (top)',
		isPrimary: false,
		monitorBrightness: 60,
		ignoresMonitorBrightness: false,
		windowsBrightness: 100,
		power: 'on',
		canStandby: true,
		hdr: { isSupported: false, isEnabled: false },
		...overrides,
	};
}
