import { CommandFailedError } from 'deck-kit/process/command_failed_error';
import type { CommandRunner } from 'deck-kit/process/run_command';

/** Answers the commands of a test from a table keyed by the command line; any other command fails, as a missing program does. */
export class FakeCommandRunner {
	readonly calls: string[] = [];

	constructor(private readonly responses: Map<string, string>) {}

	/** Replaces what a command line answers. */
	answer(commandLine: string, output: string): void {
		this.responses.set(commandLine, output);
	}

	/** Makes a command line fail again, as when the program is missing. */
	forget(commandLine: string): void {
		this.responses.delete(commandLine);
	}

	readonly runCommand: CommandRunner = (options) => {
		const commandLine = [options.command, ...options.args].join(' ');
		this.calls.push(commandLine);
		const output = this.responses.get(commandLine);
		return output === undefined
			? Promise.reject(
					new CommandFailedError({
						command: options.command,
						args: options.args,
						cause: new Error('no answer in the test'),
					})
				)
			: Promise.resolve(output);
	};

	callsStartingWith(prefix: string): string[] {
		return this.calls.filter((call) => call.startsWith(prefix));
	}
}
