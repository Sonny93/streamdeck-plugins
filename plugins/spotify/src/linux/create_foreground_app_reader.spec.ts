import type { CommandRunner } from 'deck-kit/process/run_command';
import { describe, expect, it, vi } from 'vitest';

import { buildMissingProgramError } from './build_failed_command';
import { buildFakeProcFileSystem } from './build_fake_proc_file_system';
import { createForegroundAppReader } from './create_foreground_app_reader';

const PROC_FILE_SYSTEM = buildFakeProcFileSystem([
	{
		processId: 4321,
		command: '===>>> GameMa',
		parentId: 1,
		executable: '/games/Example/BinLinux/Game.x64',
	},
]);

function buildReader(
	options: Readonly<{
		runCommand: CommandRunner;
		now?: () => number;
		onMissingKdotool?: () => void;
	}>
) {
	return createForegroundAppReader({
		runCommand: options.runCommand,
		procFileSystem: PROC_FILE_SYSTEM,
		now: options.now,
		onMissingKdotool: options.onMissingKdotool ?? vi.fn(),
	});
}

describe('createForegroundAppReader', () => {
	it('should read the executable name and the process id of the active window', async () => {
		const runCommand = vi.fn<CommandRunner>().mockResolvedValue('4321\n');

		expect(await buildReader({ runCommand })()).toStrictEqual({
			imageName: 'Game.x64',
			processId: 4321,
		});
	});

	it('should ask kdotool for the pid of the active window', async () => {
		const runCommand = vi.fn<CommandRunner>().mockResolvedValue('4321\n');

		await buildReader({ runCommand })();

		expect(runCommand).toHaveBeenCalledWith({
			command: 'kdotool',
			args: ['getactivewindow', 'getwindowpid'],
		});
	});

	it('should not call kdotool again within the cache delay', async () => {
		const runCommand = vi.fn<CommandRunner>().mockResolvedValue('4321\n');
		let time = 0;
		const read = buildReader({ runCommand, now: () => time });

		await read();
		time = 2999;
		await read();

		expect(runCommand).toHaveBeenCalledOnce();
	});

	it('should call kdotool again once the cache delay has passed', async () => {
		const runCommand = vi.fn<CommandRunner>().mockResolvedValue('4321\n');
		let time = 0;
		const read = buildReader({ runCommand, now: () => time });

		await read();
		time = 3000;
		await read();

		expect(runCommand).toHaveBeenCalledTimes(2);
	});

	it('should call kdotool again for a fresh read within the cache delay', async () => {
		const runCommand = vi.fn<CommandRunner>().mockResolvedValue('4321\n');
		let time = 0;
		const read = buildReader({ runCommand, now: () => time });

		await read();
		time = 100;
		await read({ isFresh: true });

		expect(runCommand).toHaveBeenCalledTimes(2);
	});

	it('should return undefined and report when kdotool is missing', async () => {
		const runCommand = vi
			.fn<CommandRunner>()
			.mockRejectedValue(buildMissingProgramError('kdotool'));
		const onMissingKdotool = vi.fn();

		const imageName = await buildReader({ runCommand, onMissingKdotool })();

		expect([imageName, onMissingKdotool.mock.calls.length]).toStrictEqual([
			undefined,
			1,
		]);
	});

	it('should return undefined when kdotool prints no pid', async () => {
		const runCommand = vi.fn<CommandRunner>().mockResolvedValue('\n');

		expect(await buildReader({ runCommand })()).toBeUndefined();
	});
});
