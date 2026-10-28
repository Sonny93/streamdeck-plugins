import { activateTaskbarWindow } from './activate_taskbar_window';
import { loadUser32 } from './load_user32';
import { WindowActivationError } from './window_activation_error';

/** Brings the main window of a process to the foreground (Win32). Windows only. */
export async function activateProcessWindow(processId: number): Promise<void> {
	try {
		activateTaskbarWindow(await loadUser32(), processId);
	} catch (error) {
		if (error instanceof WindowActivationError) {
			throw error;
		}
		throw new WindowActivationError({
			processId,
			reason: 'a user32 call failed',
			cause: error,
		});
	}
}
