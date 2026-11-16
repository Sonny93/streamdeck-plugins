import { CommandFailedError } from 'deck-kit/process/command_failed_error';
import { runCommand, type CommandRunner } from 'deck-kit/process/run_command';

import { KdotoolMissingError } from './kdotool_missing_error';

const KDOTOOL_COMMAND = 'kdotool';

function isMissingProgram(error: CommandFailedError): boolean {
	return (
		error.cause instanceof Error &&
		Reflect.get(error.cause, 'code') === 'ENOENT'
	);
}

/** Runs `kdotool <args>` and resolves with its stdout; a missing kdotool rejects with a KdotoolMissingError. */
export async function runKdotool(
	options: Readonly<{ args: readonly string[]; runCommand?: CommandRunner }>
): Promise<string> {
	const run = options.runCommand ?? runCommand;
	try {
		return await run({ command: KDOTOOL_COMMAND, args: options.args });
	} catch (error) {
		if (error instanceof CommandFailedError && isMissingProgram(error)) {
			throw new KdotoolMissingError({ cause: error });
		}
		throw error;
	}
}
