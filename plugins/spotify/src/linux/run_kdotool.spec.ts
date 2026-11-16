import { CommandFailedError } from 'deck-kit/process/command_failed_error';
import { describe, expect, it, vi } from 'vitest';

import { buildMissingProgramError } from './build_failed_command';
import { KdotoolMissingError } from './kdotool_missing_error';
import { runKdotool } from './run_kdotool';

describe('runKdotool', () => {
	it('should run kdotool with the arguments and return its output', async () => {
		const runCommand = vi.fn(() => Promise.resolve('{abc}\n'));

		const output = await runKdotool({ args: ['getactivewindow'], runCommand });

		expect([output, runCommand.mock.calls]).toStrictEqual([
			'{abc}\n',
			[[{ command: 'kdotool', args: ['getactivewindow'] }]],
		]);
	});

	it('should fail with a KdotoolMissingError when kdotool is not installed', async () => {
		const runCommand = vi.fn(() =>
			Promise.reject(buildMissingProgramError('kdotool'))
		);

		await expect(
			runKdotool({ args: ['getactivewindow'], runCommand })
		).rejects.toBeInstanceOf(KdotoolMissingError);
	});

	it('should rethrow any other command failure', async () => {
		const failure = new CommandFailedError({
			command: 'kdotool',
			args: [],
			cause: new Error('exit 1'),
		});
		const runCommand = vi.fn(() => Promise.reject(failure));

		await expect(
			runKdotool({ args: ['getactivewindow'], runCommand })
		).rejects.toBe(failure);
	});
});
