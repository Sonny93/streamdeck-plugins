/** Raised when an adapter is given a monitor another adapter listed, which is a bug. */
export class ForeignDisplayError extends Error {
	readonly code = 'E_FOREIGN_DISPLAY';
	override readonly name = 'ForeignDisplayError';

	constructor(options: Readonly<{ monitorId: string; adapter: string }>) {
		super(
			`The ${options.adapter} adapter did not list the monitor ${options.monitorId}.`
		);
	}
}
