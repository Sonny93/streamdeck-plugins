import { describe, expect, it, vi } from 'vitest';

import { buildFakePlatformSession } from './build_fake_platform_session';
import { isTrackInLikeTarget } from './is_track_in_like_target';

const TRACK_URI = 'spotify:track:current';
const PLAYLIST_URI = 'spotify:playlist:target';

const playlistTarget = { uri: PLAYLIST_URI, kind: 'playlist' } as const;
const likedSongsTarget = { uri: undefined, kind: 'liked-songs' } as const;

function buildPlaylistApi(trackUris: readonly string[]) {
	return {
		getContents: vi.fn(() =>
			Promise.resolve({
				items: trackUris.map((uri) => ({ uri })),
				totalLength: trackUris.length,
			})
		),
	};
}

function buildLibrary(isSaved: boolean) {
	return { contains: vi.fn(() => Promise.resolve([isSaved])) };
}

describe('isTrackInLikeTarget', () => {
	it('should be true when the playlist holds the track', async () => {
		const { session } = buildFakePlatformSession({
			PlaylistAPI: buildPlaylistApi([TRACK_URI]),
		});

		expect(
			await isTrackInLikeTarget({
				trackUri: TRACK_URI,
				target: playlistTarget,
			})(session)
		).toBe(true);
	});

	it('should be false when the playlist lacks the track', async () => {
		const { session } = buildFakePlatformSession({
			PlaylistAPI: buildPlaylistApi(['spotify:track:other']),
		});

		expect(
			await isTrackInLikeTarget({
				trackUri: TRACK_URI,
				target: playlistTarget,
			})(session)
		).toBe(false);
	});

	it('should be true when Liked Songs holds the track', async () => {
		const { session } = buildFakePlatformSession({
			LibraryAPI: buildLibrary(true),
		});

		expect(
			await isTrackInLikeTarget({
				trackUri: TRACK_URI,
				target: likedSongsTarget,
			})(session)
		).toBe(true);
	});

	it('should be false when Liked Songs lacks the track', async () => {
		const { session } = buildFakePlatformSession({
			LibraryAPI: buildLibrary(false),
		});

		expect(
			await isTrackInLikeTarget({
				trackUri: TRACK_URI,
				target: likedSongsTarget,
			})(session)
		).toBe(false);
	});
});
