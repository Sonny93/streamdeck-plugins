/** Raised when no window belongs to a process. */
export class WindowNotFoundError extends Error {
	readonly code = 'E_WINDOW_NOT_FOUND';
	override readonly name = 'WindowNotFoundError';

	constructor(options: Readonly<{ processId: number }>) {
		super(`No window belongs to the process ${options.processId}.`);
	}
}
