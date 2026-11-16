import { describe, expect, it } from 'vitest';

import { buildFakeProcFileSystem } from './build_fake_proc_file_system';
import { isSpotifyRunning } from './is_spotify_running';

describe('isSpotifyRunning', () => {
	it('should be true when a helper process is left', async () => {
		const procFileSystem = buildFakeProcFileSystem([
			{ processId: 21, command: 'spotify', parentId: 20 },
		]);

		expect(await isSpotifyRunning(procFileSystem)).toBe(true);
	});

	it('should be false when no spotify process runs', async () => {
		const procFileSystem = buildFakeProcFileSystem([
			{ processId: 10, command: 'zsh', parentId: 1 },
		]);

		expect(await isSpotifyRunning(procFileSystem)).toBe(false);
	});
});
