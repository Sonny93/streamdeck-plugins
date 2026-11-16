/** Raised when an external command cannot start, exits with an error or times out. */
export class CommandFailedError extends Error {
	readonly code = 'E_COMMAND_FAILED';
	override readonly name = 'CommandFailedError';
	readonly command: string;
	readonly args: readonly string[];
	readonly stderr: string | undefined;

	constructor(
		options: Readonly<{
			command: string;
			args: readonly string[];
			stderr?: string;
			cause: unknown;
		}>
	) {
		super(`The command "${options.command}" failed.`, {
			cause: options.cause,
		});
		this.command = options.command;
		this.args = options.args;
		this.stderr = options.stderr;
	}
}
