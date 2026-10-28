import { KeyState } from '../keys/key_state';
import type { VoltStatus } from '../../volt/volt_status';
import type { VoltButton } from '../../volt/volt_button';
import type { KeyStateValue } from '../keys/key_state_value';

/** Lights the key while its button is on, and dims it while the state of the Volt 1 is unknown (unplugged or silent so far). */
export function resolveVoltKeyState(
	status: VoltStatus,
	button: VoltButton
): KeyStateValue {
	if (status.kind !== 'ready') {
		return KeyState.unavailable;
	}
	return status.state[button] ? KeyState.on : KeyState.off;
}
