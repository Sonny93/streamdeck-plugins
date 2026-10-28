import { VoltKeyState } from './volt_key_state';
import type { VoltStatus } from '../volt/volt_status';
import type { VoltButton } from '../volt/volt_button';

/** Lights the key while its button is on, and dims it while the state of the Volt 1 is unknown (unplugged or silent so far). */
export function resolveVoltKeyState(
	status: VoltStatus,
	button: VoltButton
): number {
	if (status.kind !== 'ready') {
		return VoltKeyState.unavailable;
	}
	return status.state[button] ? VoltKeyState.on : VoltKeyState.off;
}
