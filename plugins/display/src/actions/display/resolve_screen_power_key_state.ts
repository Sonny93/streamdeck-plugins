import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import { KeyState } from '../keys/key_state';
import type { KeyStateValue } from '../keys/key_state_value';

/** Shows a "Screen Power" key lit while all its monitors are on, off once one is off, and dimmed without monitor. */
export function resolveScreenPowerKeyState(
	monitors: readonly MonitorSnapshot[]
): KeyStateValue {
	if (monitors.length === 0) {
		return KeyState.unavailable;
	}
	return monitors.every((monitor) => monitor.power === 'on')
		? KeyState.on
		: KeyState.off;
}
