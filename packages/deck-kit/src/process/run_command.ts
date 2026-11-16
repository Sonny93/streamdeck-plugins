import { execFile } from 'node:child_process';

import { CommandFailedError } from './command_failed_error';

const DEFAULT_TIMEOUT_MILLISECONDS = 5000;
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;

/** Runs a program without a shell, with a timeout and a non-localized output, and resolves with its stdout; any failure rejects with a CommandFailedError. */
export function runCommand(
	options: Readonly<{
		command: string;
		args: readonly string[];
		timeoutMilliseconds?: number;
	}>
): Promise<string> {
	const { command, args, timeoutMilliseconds } = options;
	return new Promise((resolve, reject) => {
		execFile(
			command,
			[...args],
			{
				timeout: timeoutMilliseconds ?? DEFAULT_TIMEOUT_MILLISECONDS,
				maxBuffer: MAX_OUTPUT_BYTES,
				windowsHide: true,
				encoding: 'utf8',
				env: { ...process.env, LC_ALL: 'C' },
			},
			(error, stdout, stderr) => {
				if (error) {
					reject(
						new CommandFailedError({
							command,
							args,
							stderr: stderr || undefined,
							cause: error,
						})
					);
					return;
				}
				resolve(stdout);
			}
		);
	});
}

/** The shape of runCommand, so adapters can take a fake runner in tests. */
export type CommandRunner = typeof runCommand;
