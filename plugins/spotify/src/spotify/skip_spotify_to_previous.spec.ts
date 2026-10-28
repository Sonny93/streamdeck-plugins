import { describe, expect, it, vi } from 'vitest';

import { skipSpotifyToPrevious } from './skip_spotify_to_previous';
import { buildFakePlatformSession } from './build_fake_platform_session';

describe('skipSpotifyToPrevious', () => {
	it('should skip to the previous track', async () => {
		const player = { skipToPrevious: vi.fn(() => Promise.resolve()) };
		const { session } = buildFakePlatformSession({ PlayerAPI: player });

		await skipSpotifyToPrevious(session);

		expect(player.skipToPrevious).toHaveBeenCalledTimes(1);
	});
});
