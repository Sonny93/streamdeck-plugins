import { VoltButtonNames } from './volt_button_names';
import type { VoltStatus } from './volt_status';

/** Tells whether two statuses would look the same on the keys, so the Volt 1 reports that only move its meters redraw nothing. */
export function isSameVoltStatus(
	first: VoltStatus,
	second: VoltStatus
): boolean {
	if (first.kind !== 'ready' || second.kind !== 'ready') {
		return first.kind === second.kind;
	}
	return VoltButtonNames.every(
		(button) => first.state[button] === second.state[button]
	);
}
