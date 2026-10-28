import { describe, expect, it, vi } from 'vitest';

import { buildFakePlatformSession } from './build_fake_platform_session';
import { skipSpotifyToNext } from './skip_spotify_to_next';

describe('skipSpotifyToNext', () => {
	it('should skip to the next track', async () => {
		const player = { skipToNext: vi.fn(() => Promise.resolve()) };
		const { session } = buildFakePlatformSession({ PlayerAPI: player });

		await skipSpotifyToNext(session);

		expect(player.skipToNext).toHaveBeenCalledTimes(1);
	});
});
