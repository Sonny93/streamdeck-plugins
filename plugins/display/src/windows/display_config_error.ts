/** Raised when Windows refuses to list the active displays. */
export class DisplayConfigError extends Error {
	readonly code = 'E_DISPLAY_CONFIG';
	override readonly name = 'DisplayConfigError';

	constructor(options: Readonly<{ call: string; result: unknown }>) {
		super(`${options.call} failed with ${String(options.result)}.`);
	}
}
