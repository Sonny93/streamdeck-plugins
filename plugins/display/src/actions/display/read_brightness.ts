import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import type { BrightnessControl } from './brightness_control';
import { resolveBrightnessSource } from './resolve_brightness_source';

/** Reads the brightness a brightness action shows for a monitor, `undefined` when that monitor cannot change it. */
export function readBrightness(
	monitor: MonitorSnapshot,
	control: BrightnessControl
): number | undefined {
	switch (resolveBrightnessSource(monitor, control)) {
		case 'monitor':
			return monitor.monitorBrightness;
		case 'windows':
			return monitor.windowsBrightness;
		case undefined:
			return undefined;
	}
}
