import { describe, expect, it } from 'vitest';

import { buildFakeProcFileSystem } from './build_fake_proc_file_system';
import { readSpotifyProcesses } from './read_spotify_processes';

describe('readSpotifyProcesses', () => {
	it('should list the processes named spotify with their parent', async () => {
		const procFileSystem = buildFakeProcFileSystem([
			{ processId: 10, command: 'zsh', parentId: 1 },
			{ processId: 20, command: 'spotify', parentId: 10 },
			{ processId: 21, command: 'spotify', parentId: 20 },
		]);

		expect(await readSpotifyProcesses(procFileSystem)).toStrictEqual([
			{ processId: 20, parentId: 10 },
			{ processId: 21, parentId: 20 },
		]);
	});

	it('should ignore a process that only has spotify in its name', async () => {
		const procFileSystem = buildFakeProcFileSystem([
			{ processId: 30, command: 'spotify-tray', parentId: 1 },
		]);

		expect(await readSpotifyProcesses(procFileSystem)).toStrictEqual([]);
	});

	it('should skip a process that exits during the scan', async () => {
		const procFileSystem = {
			...buildFakeProcFileSystem([]),
			listProcessIds: () => Promise.resolve([99]),
		};

		expect(await readSpotifyProcesses(procFileSystem)).toStrictEqual([]);
	});
});
