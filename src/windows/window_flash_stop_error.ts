/** Raised when the taskbar flashing of a process's windows cannot be stopped through user32. */
export class WindowFlashStopError extends Error {
	readonly code = 'E_WINDOW_FLASH_STOP';
	override readonly name = 'WindowFlashStopError';

	constructor(options: Readonly<{ processId: number; cause: unknown }>) {
		super(`Cannot stop window flashing for process ${options.processId}.`, {
			cause: options.cause,
		});
	}
}
