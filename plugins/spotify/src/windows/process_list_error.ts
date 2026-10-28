/** Raised when the list of running processes cannot be queried through tasklist. */
export class ProcessListError extends Error {
	readonly code = 'E_PROCESS_LIST_FAILED';
	override readonly name = 'ProcessListError';

	constructor(options: Readonly<{ imageName: string; cause: unknown }>) {
		super(`Cannot list running processes of image ${options.imageName}.`, {
			cause: options.cause,
		});
	}
}
