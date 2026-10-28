import { describe, expect, it, vi } from 'vitest';

import { buildFakePlatformSession } from './build_fake_platform_session';
import { toggleSpotifyPlayback } from './toggle_spotify_playback';

function buildPlayer(isPaused: boolean) {
	return {
		getState: vi.fn(() => Promise.resolve({ isPaused })),
		resume: vi.fn(() => Promise.resolve()),
		pause: vi.fn(() => Promise.resolve()),
	};
}

describe('toggleSpotifyPlayback', () => {
	it('should resume playback when it is paused', async () => {
		const player = buildPlayer(true);
		const { session } = buildFakePlatformSession({ PlayerAPI: player });

		await toggleSpotifyPlayback(session);

		expect(player.resume).toHaveBeenCalledTimes(1);
	});

	it('should not pause playback when it is paused', async () => {
		const player = buildPlayer(true);
		const { session } = buildFakePlatformSession({ PlayerAPI: player });

		await toggleSpotifyPlayback(session);

		expect(player.pause).not.toHaveBeenCalled();
	});

	it('should pause playback when it is playing', async () => {
		const player = buildPlayer(false);
		const { session } = buildFakePlatformSession({ PlayerAPI: player });

		await toggleSpotifyPlayback(session);

		expect(player.pause).toHaveBeenCalledTimes(1);
	});

	it('should not resume playback when it is playing', async () => {
		const player = buildPlayer(false);
		const { session } = buildFakePlatformSession({ PlayerAPI: player });

		await toggleSpotifyPlayback(session);

		expect(player.resume).not.toHaveBeenCalled();
	});
});
