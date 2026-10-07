import { loadUser32 } from './load_user32';
import { selectTaskbarWindows } from './select_taskbar_windows';
import { WindowFlashStopError } from './window_flash_stop_error';

/**
 * Stops the taskbar flashing of every taskbar window owned by the process (Win32 `FlashWindowEx` with FLASHW_STOP).
 * Windows only.
 */
export async function stopWindowFlashing(processId: number): Promise<void> {
	try {
		const user32 = await loadUser32();
		for (const window of selectTaskbarWindows(user32, processId)) {
			user32.stopFlashing(window);
		}
	} catch (error) {
		throw new WindowFlashStopError({ processId, cause: error });
	}
}
