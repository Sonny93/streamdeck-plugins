import { selectTaskbarWindows } from './select_taskbar_windows';
import type { User32 } from './user32';
import { WindowActivationError } from './window_activation_error';

/**
 * Brings the first taskbar window of the process to the foreground.
 * A minimized window is restored first. A zero mouse move precedes `SetForegroundWindow`,
 * because Windows otherwise denies foreground activation to background processes.
 */
export function activateTaskbarWindow(user32: User32, processId: number): void {
	const [window] = selectTaskbarWindows(user32, processId);
	if (window === undefined) {
		throw new WindowActivationError({
			processId,
			reason: 'no visible window found',
		});
	}
	if (user32.isMinimized(window)) {
		user32.restore(window);
	}
	user32.sendZeroMouseMove();
	if (!user32.setForeground(window)) {
		throw new WindowActivationError({
			processId,
			reason: 'Windows denied SetForegroundWindow',
		});
	}
}
