import { runCommand, type CommandRunner } from '../process/run_command';
import { PactlOutputError } from './pactl_output_error';

/** Runs `pactl -f json <args>` and returns the parsed JSON, to be validated by the caller. */
export async function runPactlJson(
	options: Readonly<{ args: readonly string[]; runCommand?: CommandRunner }>
): Promise<unknown> {
	const run = options.runCommand ?? runCommand;
	const output = await run({
		command: 'pactl',
		args: ['-f', 'json', ...options.args],
	});
	try {
		return JSON.parse(output);
	} catch (error) {
		throw new PactlOutputError({ cause: error });
	}
}
