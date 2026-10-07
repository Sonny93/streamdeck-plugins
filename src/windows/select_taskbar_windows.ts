import type { User32 } from './user32';
import type { WindowHandle } from './window_handle';

/** Selects the visible, unowned top-level windows of a process: the ones that appear in the taskbar. */
export function selectTaskbarWindows(
	user32: User32,
	processId: number
): WindowHandle[] {
	return user32
		.listTopLevelWindows()
		.filter(
			(window) =>
				user32.readProcessId(window) === processId &&
				user32.isVisible(window) &&
				!user32.hasOwner(window)
		);
}
