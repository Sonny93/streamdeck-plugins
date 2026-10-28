/** Raised when a process's window cannot be brought to the foreground. */
export class WindowActivationError extends Error {
	readonly code = 'E_WINDOW_ACTIVATION';
	override readonly name = 'WindowActivationError';

	constructor(
		options: Readonly<{ processId: number; reason: string; cause?: unknown }>
	) {
		super(
			`Cannot activate a window of process ${options.processId}: ${options.reason}.`,
			{
				cause: options.cause,
			}
		);
	}
}
