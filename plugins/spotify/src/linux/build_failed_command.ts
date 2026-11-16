import { CommandFailedError } from 'deck-kit/process/command_failed_error';

/** Test helper: the error `runCommand` rejects with when the program is missing from the PATH. */
export function buildMissingProgramError(command: string): CommandFailedError {
	return new CommandFailedError({
		command,
		args: [],
		cause: Object.assign(new Error(`spawn ${command} ENOENT`), {
			code: 'ENOENT',
		}),
	});
}
