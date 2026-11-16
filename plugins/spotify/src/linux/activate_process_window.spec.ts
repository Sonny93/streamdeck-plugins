import { describe, expect, it, vi } from 'vitest';

import { activateProcessWindow } from './activate_process_window';
import { WindowNotFoundError } from './window_not_found_error';

const WINDOW_ID = '{3f2a9c1e-6b7d-4e58-9a10-2c4d5e6f7a8b}';

describe('activateProcessWindow', () => {
	it('should activate the first window found for the process', async () => {
		const runCommand = vi
			.fn()
			.mockResolvedValueOnce(`${WINDOW_ID}\n{other}\n`)
			.mockResolvedValueOnce('');

		await activateProcessWindow({ processId: 4321, runCommand });

		expect(runCommand.mock.calls).toStrictEqual([
			[
				{
					command: 'kdotool',
					args: ['search', '--all', '--pid', '4321'],
				},
			],
			[{ command: 'kdotool', args: ['windowactivate', WINDOW_ID] }],
		]);
	});

	it('should fail when the process has no window', async () => {
		const runCommand = vi.fn().mockResolvedValue('\n');

		await expect(
			activateProcessWindow({ processId: 4321, runCommand })
		).rejects.toBeInstanceOf(WindowNotFoundError);
	});
});
