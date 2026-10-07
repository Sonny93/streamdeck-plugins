import { describe, expect, it, vi } from 'vitest';

import { listSpotifyPlaylists } from './list_spotify_playlists';
import { buildFakePlatformSession } from './build_fake_platform_session';

const LIKED_SONGS_URI = 'spotify:playlist:liked';
const PLAYLIST_FILTER_ID = '2';
const PAGE_SIZE = 100;

type LibraryQuery = Readonly<{
	filters: readonly string[];
	limit: number;
	offset: number;
}>;

function buildPlaylistItem(overrides: Record<string, unknown> = {}) {
	return {
		type: 'playlist',
		uri: 'spotify:playlist:a',
		name: 'Road trip',
		isLoading: false,
		canAddTo: true,
		isOwnedBySelf: true,
		images: [{ url: 'spotify:image:abc', width: 300, height: 300 }],
		...overrides,
	};
}

function buildSession(items: unknown[], rootItems: unknown[] = []) {
	const getContents = vi.fn((query: LibraryQuery) =>
		Promise.resolve({
			items: items.slice(query.offset, query.offset + query.limit),
			totalLength: items.length,
		})
	);
	const library = {
		getStaticallyKnownFilters: () => ({
			playlist: { filterId: PLAYLIST_FILTER_ID },
		}),
		getContents,
	};
	const { session } = buildFakePlatformSession({
		LibraryAPI: library,
		RootlistAPI: {
			getContents: vi.fn(() => Promise.resolve({ items: rootItems })),
		},
		LibraryLikedSongsUri: { toString: () => LIKED_SONGS_URI },
	});
	return { session, getContents };
}

describe('listSpotifyPlaylists', () => {
	it('should list liked songs first, then the playlists', async () => {
		const { session } = buildSession([buildPlaylistItem()]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists.map((playlist) => playlist.uri)).toEqual([
			LIKED_SONGS_URI,
			'spotify:playlist:a',
		]);
	});

	it('should keep the library order inside the owned and the other groups', async () => {
		const { session } = buildSession([
			buildPlaylistItem({ name: 'Mix 1', isOwnedBySelf: false }),
			buildPlaylistItem({ name: 'Mine 1' }),
			buildPlaylistItem({ name: 'Mix 2', isOwnedBySelf: false }),
			buildPlaylistItem({ name: 'Mine 2' }),
		]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists.map((playlist) => playlist.name)).toEqual([
			'Liked Songs',
			'Mine 1',
			'Mine 2',
			'Mix 1',
			'Mix 2',
		]);
	});

	it('should ask the library for the playlist filter only, leaving the sort to the user', async () => {
		const { session, getContents } = buildSession([buildPlaylistItem()]);

		await listSpotifyPlaylists(session);

		expect(getContents).toHaveBeenCalledWith({
			filters: [PLAYLIST_FILTER_ID],
			limit: PAGE_SIZE,
			offset: 0,
		});
		expect(Object.keys(getContents.mock.calls[0]?.[0] ?? {})).not.toContain(
			'sortOrder'
		);
	});

	it('should read every page of the library', async () => {
		const items = Array.from({ length: PAGE_SIZE * 2 + 30 }, (_, index) =>
			buildPlaylistItem({ uri: `spotify:playlist:${index}`, name: `P${index}` })
		);
		const { session, getContents } = buildSession(items);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists).toHaveLength(items.length + 1);
		expect(playlists.at(-1)?.uri).toBe(`spotify:playlist:${items.length - 1}`);
		expect(getContents.mock.calls.map(([query]) => query.offset)).toEqual([
			0,
			PAGE_SIZE,
			PAGE_SIZE * 2,
		]);
	});

	it('should stop when a page comes back empty', async () => {
		const getContents = vi.fn(() =>
			Promise.resolve({ items: [], totalLength: 5 })
		);
		const { session } = buildFakePlatformSession({
			LibraryAPI: {
				getStaticallyKnownFilters: () => ({
					playlist: { filterId: PLAYLIST_FILTER_ID },
				}),
				getContents,
			},
			RootlistAPI: { getContents: () => Promise.resolve({ items: [] }) },
			LibraryLikedSongsUri: { toString: () => LIKED_SONGS_URI },
		});

		expect(await listSpotifyPlaylists(session)).toHaveLength(1);
		expect(getContents).toHaveBeenCalledTimes(1);
	});

	it('should keep a named playlist that Spotify has not fully loaded', async () => {
		const { session } = buildSession([buildPlaylistItem({ isLoading: true })]);

		expect(await listSpotifyPlaylists(session)).toHaveLength(2);
	});

	it('should skip a playlist without name', async () => {
		const { session } = buildSession([buildPlaylistItem({ name: '' })]);

		expect(await listSpotifyPlaylists(session)).toHaveLength(1);
	});

	it('should skip the items that are not playlists', async () => {
		const { session } = buildSession([
			{ type: 'folder', uri: 'spotify:user:u:folder:f', name: 'Folder' },
			buildPlaylistItem(),
		]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists.map((playlist) => playlist.name)).toEqual([
			'Liked Songs',
			'Road trip',
		]);
	});

	it('should prefer the smallest image', async () => {
		const { session } = buildSession([
			buildPlaylistItem({
				images: [
					{ url: 'spotify:image:large', width: 640, height: 640 },
					{ url: 'spotify:image:small', width: 64, height: 64 },
					{ url: 'spotify:image:medium', width: 300, height: 300 },
				],
			}),
		]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists[1]?.imageUrl).toBe('https://i.scdn.co/image/small');
	});

	it('should take the cover from the root list, preferring small, then standard, then the first image', async () => {
		const rootImage = (url: string, label: string) => ({ url, label });
		const root = (uri: string, images: unknown[]) => ({
			type: 'playlist',
			uri,
			images,
		});
		const { session } = buildSession(
			[
				buildPlaylistItem({ uri: 'spotify:playlist:s' }),
				buildPlaylistItem({ uri: 'spotify:playlist:t' }),
				buildPlaylistItem({ uri: 'spotify:playlist:u' }),
			],
			[
				root('spotify:playlist:s', [
					rootImage('spotify:image:std', 'standard'),
					rootImage('spotify:image:small', 'small'),
				]),
				root('spotify:playlist:t', [
					rootImage('spotify:image:large', 'large'),
					rootImage('spotify:image:std', 'standard'),
				]),
				root('spotify:playlist:u', [rootImage('spotify:image:first', 'large')]),
			]
		);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists.slice(1).map((playlist) => playlist.imageUrl)).toEqual([
			'https://i.scdn.co/image/small',
			'https://i.scdn.co/image/std',
			'https://i.scdn.co/image/first',
		]);
	});

	it('should read the root list inside folders', async () => {
		const { session } = buildSession(
			[buildPlaylistItem()],
			[
				{
					type: 'folder',
					items: [
						{
							type: 'playlist',
							uri: 'spotify:playlist:a',
							images: [{ url: 'spotify:image:nested', label: 'small' }],
						},
					],
				},
			]
		);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists[1]?.imageUrl).toBe('https://i.scdn.co/image/nested');
	});

	it('should give the root list image priority over the library one', async () => {
		const { session } = buildSession(
			[buildPlaylistItem()],
			[
				{
					type: 'playlist',
					uri: 'spotify:playlist:a',
					images: [{ url: 'spotify:image:fromroot', label: 'small' }],
				},
			]
		);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists[1]?.imageUrl).toBe('https://i.scdn.co/image/fromroot');
	});

	it('should fall back to the smallest library image when the root list lacks the playlist', async () => {
		const { session } = buildSession(
			[
				buildPlaylistItem({
					images: [
						{ url: 'spotify:image:big', width: 300 },
						{ url: 'spotify:image:tiny', width: 64 },
					],
				}),
			],
			[{ type: 'playlist', uri: 'spotify:playlist:other', images: [] }]
		);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists[1]?.imageUrl).toBe('https://i.scdn.co/image/tiny');
	});

	it('should fall back to the first image when none has a width', async () => {
		const { session } = buildSession([
			buildPlaylistItem({
				images: [
					{ url: 'spotify:image:first' },
					{ url: 'spotify:image:second' },
				],
			}),
		]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists[1]?.imageUrl).toBe('https://i.scdn.co/image/first');
	});

	it('should give an undefined image when the playlist has none', async () => {
		const { session } = buildSession([buildPlaylistItem({ images: [] })]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists[1]?.imageUrl).toBeUndefined();
	});

	it('should give an undefined image when the playlist has no image list', async () => {
		const { session } = buildSession([
			buildPlaylistItem({ images: undefined }),
		]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists[1]?.imageUrl).toBeUndefined();
	});

	it('should report a playlist that cannot be added to', async () => {
		const { session } = buildSession([buildPlaylistItem({ canAddTo: false })]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists[1]?.canAdd).toBe(false);
	});
});
