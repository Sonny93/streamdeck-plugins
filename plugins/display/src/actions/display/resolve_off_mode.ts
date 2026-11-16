import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import type { ScreenOffMode } from '../../displays/screen_off_mode';

/**
 * Tells how monitors are turned off: the saved way, else a black screen, else the standby when a monitor cannot be covered.
 * A black screen saved on a system that cannot draw one stays as saved, so the action shows it is unavailable.
 */
export function resolveOffMode(
	savedMode: ScreenOffMode | undefined,
	monitors: readonly MonitorSnapshot[]
): ScreenOffMode {
	if (savedMode !== undefined) {
		return savedMode;
	}
	return monitors.every((monitor) => monitor.canBlackScreen)
		? 'blackScreen'
		: 'standby';
}
