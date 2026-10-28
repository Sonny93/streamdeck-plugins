/** Raised when the foreground window cannot be inspected through user32. */
export class ForegroundCheckError extends Error {
	readonly code = 'E_FOREGROUND_CHECK';
	override readonly name = 'ForegroundCheckError';

	constructor(options: Readonly<{ processId: number; cause: unknown }>) {
		super(
			`Cannot check whether process ${options.processId} is in the foreground.`,
			{
				cause: options.cause,
			}
		);
	}
}
