import type { User32 } from './user32';

/** Tells whether the current foreground window belongs to the given process. */
export function isForegroundWindowOwnedBy(
	user32: User32,
	processId: number
): boolean {
	const foregroundWindow = user32.getForegroundWindow();
	if (foregroundWindow === undefined) {
		return false;
	}
	return user32.readProcessId(foregroundWindow) === processId;
}
