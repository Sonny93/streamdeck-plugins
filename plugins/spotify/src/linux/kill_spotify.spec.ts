import { describe, expect, it, vi } from 'vitest';

import { buildFakeProcFileSystem } from './build_fake_proc_file_system';
import { killSpotify } from './kill_spotify';
import { SpotifyKillError } from './spotify_kill_error';

const PROCESSES = [
	{ processId: 20, command: 'spotify', parentId: 10 },
	{ processId: 21, command: 'spotify', parentId: 20 },
	{ processId: 22, command: 'spotify', parentId: 21 },
];

function buildErrno(code: string): Error {
	return Object.assign(new Error(code), { code });
}

describe('killSpotify', () => {
	it('should send SIGTERM to the main process only', async () => {
		const sendSignal = vi.fn();

		await killSpotify({
			procFileSystem: buildFakeProcFileSystem(PROCESSES),
			sendSignal,
		});

		expect(sendSignal.mock.calls).toStrictEqual([[20, 'SIGTERM']]);
	});

	it('should do nothing when Spotify is not running', async () => {
		const sendSignal = vi.fn();

		await killSpotify({
			procFileSystem: buildFakeProcFileSystem([]),
			sendSignal,
		});

		expect(sendSignal).not.toHaveBeenCalled();
	});

	it('should ignore a process that is already gone', async () => {
		const sendSignal = vi.fn(() => {
			throw buildErrno('ESRCH');
		});

		await expect(
			killSpotify({
				procFileSystem: buildFakeProcFileSystem(PROCESSES),
				sendSignal,
			})
		).resolves.toBeUndefined();
	});

	it('should fail with a typed error when the signal is refused', async () => {
		const sendSignal = vi.fn(() => {
			throw buildErrno('EPERM');
		});

		await expect(
			killSpotify({
				procFileSystem: buildFakeProcFileSystem(PROCESSES),
				sendSignal,
			})
		).rejects.toBeInstanceOf(SpotifyKillError);
	});
});
