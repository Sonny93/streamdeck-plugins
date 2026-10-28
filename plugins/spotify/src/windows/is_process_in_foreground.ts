import { ForegroundCheckError } from './foreground_check_error';
import { isForegroundWindowOwnedBy } from './is_foreground_window_owned_by';
import { loadUser32 } from './load_user32';

/** Tells whether the OS foreground window belongs to the process (Win32 `GetForegroundWindow`). Windows only. */
export async function isProcessInForeground(
	processId: number
): Promise<boolean> {
	try {
		return isForegroundWindowOwnedBy(await loadUser32(), processId);
	} catch (error) {
		throw new ForegroundCheckError({ processId, cause: error });
	}
}
