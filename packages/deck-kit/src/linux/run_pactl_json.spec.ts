import { describe, expect, it, vi } from 'vitest';

import { PactlOutputError } from './pactl_output_error';
import { runPactlJson } from './run_pactl_json';

describe('runPactlJson', () => {
	it('should run pactl with the json format and parse its output', async () => {
		const runCommand = vi.fn(() => Promise.resolve('[{"name":"sink"}]'));

		const parsed = await runPactlJson({
			args: ['list', 'sinks'],
			runCommand,
		});

		expect(runCommand).toHaveBeenCalledWith({
			command: 'pactl',
			args: ['-f', 'json', 'list', 'sinks'],
		});
		expect(parsed).toEqual([{ name: 'sink' }]);
	});

	it('should throw a PactlOutputError when the output is not JSON', async () => {
		const runCommand = vi.fn(() => Promise.resolve('not json'));

		await expect(
			runPactlJson({ args: ['list'], runCommand })
		).rejects.toBeInstanceOf(PactlOutputError);
	});
});
