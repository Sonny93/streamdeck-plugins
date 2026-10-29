import type { BrightnessSource } from '../../displays/brightness_source';
import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import { MonitorUnavailableError } from '../../displays/monitor_unavailable_error';
import type { BrightnessControl } from './brightness_control';
import { resolveBrightnessSource } from './resolve_brightness_source';

/**
 * Applies a brightness change to each monitor that can make it with the control of the action, all at once.
 * Throws when none of them can, so the action shows an alert.
 */
export async function changeMonitorsBrightness(
	monitors: readonly MonitorSnapshot[],
	control: BrightnessControl,
	change: (monitorId: string, source: BrightnessSource) => Promise<void>
): Promise<void> {
	const changes = monitors.flatMap((monitor) => {
		const source = resolveBrightnessSource(monitor, control);
		return source === undefined ? [] : [change(monitor.id, source)];
	});
	if (changes.length === 0) {
		throw new MonitorUnavailableError({
			monitorId: monitors.map((monitor) => monitor.id).join(', '),
			reason: 'No monitor can change its brightness',
		});
	}
	await Promise.all(changes);
}
