import { describe, expect, it, vi } from 'vitest';

import { buildFakePlatformSession } from './build_fake_platform_session';
import { playSpotifyPlaylist } from './play_spotify_playlist';

function buildPlayer() {
	return { play: vi.fn((..._args: unknown[]) => Promise.resolve()) };
}

describe('playSpotifyPlaylist', () => {
	it('should play the context with the given uri', async () => {
		const player = buildPlayer();
		const { session } = buildFakePlatformSession({ PlayerAPI: player });

		await playSpotifyPlaylist('spotify:playlist:abc')(session);

		expect(player.play.mock.calls[0]?.[0]).toMatchObject({
			uri: 'spotify:playlist:abc',
		});
	});

	it('should play only once', async () => {
		const player = buildPlayer();
		const { session } = buildFakePlatformSession({ PlayerAPI: player });

		await playSpotifyPlaylist('spotify:playlist:abc')(session);

		expect(player.play).toHaveBeenCalledTimes(1);
	});

	it('should pass two empty objects after the context', async () => {
		const player = buildPlayer();
		const { session } = buildFakePlatformSession({ PlayerAPI: player });

		await playSpotifyPlaylist('spotify:playlist:abc')(session);

		expect(player.play.mock.calls[0]?.slice(1)).toMatchObject([{}, {}]);
	});

	it('should keep a uri holding quotes and template syntax intact', async () => {
		const player = buildPlayer();
		const { session } = buildFakePlatformSession({ PlayerAPI: player });
		const uri = 'spotify:playlist:"\';`${1}';

		await playSpotifyPlaylist(uri)(session);

		expect(player.play.mock.calls[0]?.[0]).toMatchObject({ uri });
	});
});
