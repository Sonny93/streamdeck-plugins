import { describe, expect, it, vi } from 'vitest';

import { addCurrentTrackToLikeTarget } from './add_current_track_to_like_target';
import { buildFakePlatformSession } from './build_fake_platform_session';
import { SpotifyNoCurrentTrackError } from './spotify_no_current_track_error';

const TRACK_URI = 'spotify:track:current';
const PLAYLIST_URI = 'spotify:playlist:target';
const PAGE_SIZE = 500;
const PAGE_COUNT = 3;

const playlistTarget = { uri: PLAYLIST_URI, kind: 'playlist' } as const;
const likedSongsTarget = { uri: undefined, kind: 'liked-songs' } as const;

function buildPlayer(trackUri: string | undefined) {
	return {
		getState: vi.fn(() =>
			Promise.resolve({
				item: trackUri === undefined ? null : { uri: trackUri },
			})
		),
	};
}

function buildPlaylistApi(trackUris: readonly string[]) {
	return {
		getContents: vi.fn(
			(_uri: string, options?: Readonly<{ offset: number; limit: number }>) => {
				const offset = options?.offset ?? 0;
				const limit = options?.limit ?? trackUris.length;
				return Promise.resolve({
					items: trackUris
						.slice(offset, offset + limit)
						.map((uri) => ({ uri })),
					totalLength: trackUris.length,
				});
			}
		),
		add: vi.fn((..._args: unknown[]) => Promise.resolve()),
	};
}

function buildLibrary(savedTrackUris: readonly string[]) {
	return {
		contains: vi.fn((...uris: string[]) =>
			Promise.resolve(uris.map((uri) => savedTrackUris.includes(uri)))
		),
		add: vi.fn((..._args: unknown[]) => Promise.resolve()),
	};
}

describe('addCurrentTrackToLikeTarget', () => {
	it('should append the track to the playlist', async () => {
		const playlistApi = buildPlaylistApi(['spotify:track:other']);
		const { session } = buildFakePlatformSession({
			PlayerAPI: buildPlayer(TRACK_URI),
			PlaylistAPI: playlistApi,
		});

		await addCurrentTrackToLikeTarget(playlistTarget)(session);

		expect(playlistApi.add.mock.calls).toMatchObject([
			[PLAYLIST_URI, [TRACK_URI], { after: 'end' }],
		]);
	});

	it('should not add a track already in the playlist', async () => {
		const playlistApi = buildPlaylistApi(['spotify:track:other', TRACK_URI]);
		const { session } = buildFakePlatformSession({
			PlayerAPI: buildPlayer(TRACK_URI),
			PlaylistAPI: playlistApi,
		});

		await addCurrentTrackToLikeTarget(playlistTarget)(session);

		expect(playlistApi.add).not.toHaveBeenCalled();
	});

	it('should find a track that sits on a later page of the playlist', async () => {
		const trackUris = Array.from(
			{ length: PAGE_SIZE * PAGE_COUNT },
			(_, index) => `spotify:track:${index}`
		);
		const playlistApi = buildPlaylistApi([...trackUris, TRACK_URI]);
		const { session } = buildFakePlatformSession({
			PlayerAPI: buildPlayer(TRACK_URI),
			PlaylistAPI: playlistApi,
		});

		await addCurrentTrackToLikeTarget(playlistTarget)(session);

		expect(playlistApi.add).not.toHaveBeenCalled();
	});

	it('should read every page of the playlist before adding', async () => {
		const trackUris = Array.from(
			{ length: PAGE_SIZE * PAGE_COUNT },
			(_, index) => `spotify:track:${index}`
		);
		const playlistApi = buildPlaylistApi(trackUris);
		const { session } = buildFakePlatformSession({
			PlayerAPI: buildPlayer(TRACK_URI),
			PlaylistAPI: playlistApi,
		});

		await addCurrentTrackToLikeTarget(playlistTarget)(session);

		expect(playlistApi.getContents).toHaveBeenCalledTimes(PAGE_COUNT);
	});

	it('should save the track to Liked Songs through the library', async () => {
		const library = buildLibrary([]);
		const { session } = buildFakePlatformSession({
			PlayerAPI: buildPlayer(TRACK_URI),
			LibraryAPI: library,
		});

		await addCurrentTrackToLikeTarget(likedSongsTarget)(session);

		expect(library.add.mock.calls).toMatchObject([[{ uris: [TRACK_URI] }]]);
	});

	it('should not save a track already in Liked Songs', async () => {
		const library = buildLibrary([TRACK_URI]);
		const { session } = buildFakePlatformSession({
			PlayerAPI: buildPlayer(TRACK_URI),
			LibraryAPI: library,
		});

		await addCurrentTrackToLikeTarget(likedSongsTarget)(session);

		expect(library.add).not.toHaveBeenCalled();
	});

	it('should reject with a no current track error when nothing is loaded', async () => {
		const library = buildLibrary([]);
		const { session } = buildFakePlatformSession({
			PlayerAPI: buildPlayer(undefined),
			LibraryAPI: library,
		});

		await expect(
			addCurrentTrackToLikeTarget(likedSongsTarget)(session)
		).rejects.toThrow(SpotifyNoCurrentTrackError);
	});

	it('should add nothing when nothing is loaded', async () => {
		const library = buildLibrary([]);
		const { session } = buildFakePlatformSession({
			PlayerAPI: buildPlayer(undefined),
			LibraryAPI: library,
		});

		await addCurrentTrackToLikeTarget(likedSongsTarget)(session).catch(
			() => undefined
		);

		expect(library.add).not.toHaveBeenCalled();
	});
});
