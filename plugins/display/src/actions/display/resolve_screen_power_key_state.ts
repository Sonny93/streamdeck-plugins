import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import { KeyState } from '../keys/key_state';
import type { KeyStateValue } from '../keys/key_state_value';
import type { DisplayActionConfig } from './display_action_config';
import { resolveOffMode } from './resolve_off_mode';

/**
 * Shows a "Screen Power" key lit while all its monitors are on, off once one is off,
 * and dimmed without monitor or when its black screen cannot cover them.
 */
export function resolveScreenPowerKeyState(
	monitors: readonly MonitorSnapshot[],
	config: DisplayActionConfig
): KeyStateValue {
	const cannotBlackOut =
		resolveOffMode(config.offMode, monitors) === 'blackScreen' &&
		monitors.some((monitor) => !monitor.canBlackScreen);
	if (monitors.length === 0 || cannotBlackOut) {
		return KeyState.unavailable;
	}
	return monitors.every((monitor) => monitor.power === 'on')
		? KeyState.on
		: KeyState.off;
}
