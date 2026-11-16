import type { BrightnessSource } from '../../displays/brightness_source';
import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import type { BrightnessControl } from './brightness_control';

/** Tells what a brightness action changes on a monitor, `undefined` when that monitor cannot change it. */
export function resolveBrightnessSource(
	monitor: MonitorSnapshot,
	control: BrightnessControl
): BrightnessSource | undefined {
	const hasMonitorBrightness = monitor.monitorBrightness !== undefined;
	const hasSystemBrightness = monitor.systemBrightness !== undefined;
	switch (control) {
		case 'monitor':
			return hasMonitorBrightness ? 'monitor' : undefined;
		case 'windows':
			return hasSystemBrightness ? 'system' : undefined;
		case 'auto':
			if (hasMonitorBrightness && !monitor.ignoresMonitorBrightness) {
				return 'monitor';
			}
			return hasSystemBrightness ? 'system' : undefined;
	}
}
