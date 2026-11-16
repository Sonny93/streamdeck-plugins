import { describe, expect, it } from 'vitest';

import { CommandFailedError } from './command_failed_error';
import { runCommand } from './run_command';

describe('runCommand', () => {
	it('should resolve with stdout when the command succeeds', async () => {
		const output = await runCommand({
			command: process.execPath,
			args: ['-e', 'process.stdout.write("hello")'],
		});

		expect(output).toBe('hello');
	});

	it('should force the C locale in the command environment', async () => {
		const output = await runCommand({
			command: process.execPath,
			args: ['-e', 'process.stdout.write(process.env.LC_ALL ?? "")'],
		});

		expect(output).toBe('C');
	});

	it('should reject with a CommandFailedError holding stderr when the command exits with an error', async () => {
		const failure = runCommand({
			command: process.execPath,
			args: ['-e', 'process.stderr.write("boom"); process.exit(3)'],
		});

		await expect(failure).rejects.toBeInstanceOf(CommandFailedError);
		await expect(failure).rejects.toMatchObject({
			code: 'E_COMMAND_FAILED',
			stderr: 'boom',
		});
	});

	it('should reject with a CommandFailedError when the command does not exist', async () => {
		await expect(
			runCommand({ command: 'deck-kit-missing-command', args: [] })
		).rejects.toBeInstanceOf(CommandFailedError);
	});

	it('should reject with a CommandFailedError when the command exceeds the timeout', async () => {
		await expect(
			runCommand({
				command: process.execPath,
				args: ['-e', 'setTimeout(() => {}, 10000)'],
				timeoutMilliseconds: 100,
			})
		).rejects.toBeInstanceOf(CommandFailedError);
	});
});
