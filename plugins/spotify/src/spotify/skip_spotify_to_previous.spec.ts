import { describe, expect, it, vi } from 'vitest';

import { buildFakePlatformSession } from './build_fake_platform_session';
import { skipSpotifyToPrevious } from './skip_spotify_to_previous';

describe('skipSpotifyToPrevious', () => {
	it('should skip to the previous track', async () => {
		const player = { skipToPrevious: vi.fn(() => Promise.resolve()) };
		const { session } = buildFakePlatformSession({ PlayerAPI: player });

		await skipSpotifyToPrevious(session);

		expect(player.skipToPrevious).toHaveBeenCalledTimes(1);
	});
});
