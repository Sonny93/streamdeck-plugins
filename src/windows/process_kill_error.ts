/** Raised when the processes of an image cannot be terminated through taskkill. */
export class ProcessKillError extends Error {
	readonly code = 'E_PROCESS_KILL_FAILED';
	override readonly name = 'ProcessKillError';

	constructor(options: Readonly<{ imageName: string; cause: unknown }>) {
		super(`Cannot kill processes of image ${options.imageName}.`, {
			cause: options.cause,
		});
	}
}
