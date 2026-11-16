import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import type { StripTone } from './strip_tone';

/** The tone of the strips: sky blue while any of the monitors is lit, neutral when all are off or there is none. */
export function resolveStripTone(
	monitors: readonly MonitorSnapshot[]
): StripTone {
	return monitors.some((monitor) => monitor.power === 'on') ? 'sky' : 'neutral';
}
