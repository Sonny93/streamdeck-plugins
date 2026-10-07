import { describe, expect, it, vi } from 'vitest';

import { listSpotifyPlaylists } from './list_spotify_playlists';
import { buildFakePlatformSession } from './build_fake_platform_session';

const LIKED_SONGS_URI = 'spotify:playlist:liked';

function buildPlaylistItem(overrides: Record<string, unknown> = {}) {
	return {
		type: 'playlist',
		uri: 'spotify:playlist:a',
		name: 'Road trip',
		isLoaded: true,
		canAdd: true,
		isOwnedBySelf: true,
		images: [{ url: 'spotify:image:abc', label: 'standard' }],
		...overrides,
	};
}

function buildSession(items: unknown[]) {
	const rootlist = {
		getContents: vi.fn(() => Promise.resolve({ items })),
	};
	return buildFakePlatformSession({
		RootlistAPI: rootlist,
		LibraryLikedSongsUri: { toString: () => LIKED_SONGS_URI },
	}).session;
}

describe('listSpotifyPlaylists', () => {
	it('should list liked songs first, then the playlists', async () => {
		const session = buildSession([buildPlaylistItem()]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists.map((playlist) => playlist.uri)).toEqual([
			LIKED_SONGS_URI,
			'spotify:playlist:a',
		]);
	});

	it('should list the owned playlists before the others', async () => {
		const session = buildSession([
			buildPlaylistItem({ uri: 'spotify:playlist:mix', isOwnedBySelf: false }),
			buildPlaylistItem({ uri: 'spotify:playlist:mine' }),
		]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists.map((playlist) => playlist.uri)).toEqual([
			LIKED_SONGS_URI,
			'spotify:playlist:mine',
			'spotify:playlist:mix',
		]);
	});

	it('should keep a named playlist that Spotify has not fully loaded', async () => {
		const session = buildSession([buildPlaylistItem({ isLoaded: false })]);

		expect(await listSpotifyPlaylists(session)).toHaveLength(2);
	});

	it('should skip a playlist without name', async () => {
		const session = buildSession([buildPlaylistItem({ name: '' })]);

		expect(await listSpotifyPlaylists(session)).toHaveLength(1);
	});

	it('should flatten the playlists nested in folders', async () => {
		const folder = { type: 'folder', items: [buildPlaylistItem()] };
		const session = buildSession([folder]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists.map((playlist) => playlist.name)).toEqual([
			'Liked Songs',
			'Road trip',
		]);
	});

	it('should prefer the image labelled small, then standard', async () => {
		const session = buildSession([
			buildPlaylistItem({
				images: [
					{ url: 'spotify:image:small', label: 'small' },
					{ url: 'spotify:image:std', label: 'standard' },
				],
			}),
		]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists[1]?.imageUrl).toBe('https://i.scdn.co/image/small');
	});

	it('should use the image labelled standard when none is labelled small', async () => {
		const session = buildSession([
			buildPlaylistItem({
				images: [
					{ url: 'spotify:image:large', label: 'large' },
					{ url: 'spotify:image:std', label: 'standard' },
				],
			}),
		]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists[1]?.imageUrl).toBe('https://i.scdn.co/image/std');
	});

	it('should fall back to the first image when none is labelled small or standard', async () => {
		const session = buildSession([
			buildPlaylistItem({
				images: [{ url: 'spotify:image:first', label: 'large' }],
			}),
		]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists[1]?.imageUrl).toBe('https://i.scdn.co/image/first');
	});

	it('should give an undefined image when the playlist has none', async () => {
		const session = buildSession([buildPlaylistItem({ images: [] })]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists[1]?.imageUrl).toBeUndefined();
	});

	it('should report a playlist that cannot be added to', async () => {
		const session = buildSession([buildPlaylistItem({ canAdd: false })]);

		const playlists = await listSpotifyPlaylists(session);

		expect(playlists[1]?.canAdd).toBe(false);
	});
});
