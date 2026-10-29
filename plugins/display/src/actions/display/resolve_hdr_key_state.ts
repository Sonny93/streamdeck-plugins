import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import { KeyState } from '../keys/key_state';
import type { KeyStateValue } from '../keys/key_state_value';

/** Shows an "HDR" key lit while HDR is on, and dimmed while its monitor is not lit or cannot show HDR. */
export function resolveHdrKeyState(
	monitor: MonitorSnapshot | undefined
): KeyStateValue {
	if (monitor === undefined || !monitor.hdr.isSupported) {
		return KeyState.unavailable;
	}
	return monitor.hdr.isEnabled ? KeyState.on : KeyState.off;
}
