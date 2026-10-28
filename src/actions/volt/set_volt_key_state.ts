import type { WillAppearEvent } from '@elgato/streamdeck';

import type { VoltStatus } from '../../volt/volt_status';
import type { VoltButton } from '../../volt/volt_button';
import { resolveVoltKeyState } from './resolve_volt_key_state';

/** Shows on a key whether its Volt 1 button is on. */
export async function setVoltKeyState(
	action: WillAppearEvent['action'],
	status: VoltStatus,
	button: VoltButton
): Promise<void> {
	if (!action.isKey()) {
		return;
	}
	await action.setState(resolveVoltKeyState(status, button));
}
