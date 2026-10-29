import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import { KeyState } from '../keys/key_state';
import type { KeyStateValue } from '../keys/key_state_value';
import type { DisplayActionConfig } from './display_action_config';
import { readBrightness } from './read_brightness';

/**
 * Shows a "Brightness" key that sets a value lit while its monitors are at that value, and one that moves it always lit;
 * dimmed while none of its monitors can change its brightness.
 */
export function resolveBrightnessKeyState(
	monitors: readonly MonitorSnapshot[],
	config: DisplayActionConfig
): KeyStateValue {
	const brightnesses = monitors.flatMap((monitor) => {
		const brightness = readBrightness(monitor, config.brightnessControl);
		return brightness === undefined ? [] : [brightness];
	});
	if (brightnesses.length === 0) {
		return KeyState.unavailable;
	}
	if (config.brightnessKeyMode !== 'set') {
		return KeyState.on;
	}
	return brightnesses.every((brightness) => brightness === config.value)
		? KeyState.on
		: KeyState.off;
}
