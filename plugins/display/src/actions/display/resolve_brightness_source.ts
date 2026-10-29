import type { BrightnessSource } from '../../displays/brightness_source';
import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import type { BrightnessControl } from './brightness_control';

/** Tells what a brightness action changes on a monitor, `undefined` when that monitor cannot change it. */
export function resolveBrightnessSource(
	monitor: MonitorSnapshot,
	control: BrightnessControl
): BrightnessSource | undefined {
	const hasMonitorBrightness = monitor.monitorBrightness !== undefined;
	const hasWindowsBrightness = monitor.windowsBrightness !== undefined;
	switch (control) {
		case 'monitor':
			return hasMonitorBrightness ? 'monitor' : undefined;
		case 'windows':
			return hasWindowsBrightness ? 'windows' : undefined;
		case 'auto':
			if (hasMonitorBrightness && !monitor.ignoresMonitorBrightness) {
				return 'monitor';
			}
			return hasWindowsBrightness ? 'windows' : undefined;
	}
}
