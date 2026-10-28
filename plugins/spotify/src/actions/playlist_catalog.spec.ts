import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runSpotifyQuery } from '../spotify/run_spotify_query';
import { SpotifyNotReachableError } from '../spotify/spotify_not_reachable_error';
import type { SpotifyPlaylist } from '../spotify/spotify_playlist';
import { PlaylistCatalog } from './playlist_catalog';

vi.mock('../spotify/run_spotify_query');
vi.mock('@elgato/streamdeck', () => ({
	streamDeck: { logger: { debug: vi.fn(), error: vi.fn() } },
}));

const MAX_AGE_MILLISECONDS = 60_000;

const PLAYLISTS: SpotifyPlaylist[] = [
	{
		uri: 'spotify:playlist:liked',
		name: 'Liked Songs',
		imageUrl: undefined,
		kind: 'liked-songs',
		canAdd: true,
	},
];

describe('PlaylistCatalog', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.mocked(runSpotifyQuery).mockReset();
		vi.mocked(runSpotifyQuery).mockResolvedValue(PLAYLISTS);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should have no content before the first refresh', () => {
		expect(new PlaylistCatalog().hasContent()).toBe(false);
	});

	it('should expose the playlists once refreshed', async () => {
		const catalog = new PlaylistCatalog();

		await catalog.refresh();

		expect(catalog.playlists).toEqual(PLAYLISTS);
	});

	it('should have content once refreshed', async () => {
		const catalog = new PlaylistCatalog();

		await catalog.refresh();

		expect(catalog.hasContent()).toBe(true);
	});

	it('should share one query between concurrent refreshes', async () => {
		const catalog = new PlaylistCatalog();

		await Promise.all([catalog.refresh(), catalog.refresh()]);

		expect(runSpotifyQuery).toHaveBeenCalledTimes(1);
	});

	it('should query again once the previous refresh is done', async () => {
		const catalog = new PlaylistCatalog();
		await catalog.refresh();

		await catalog.refresh();

		expect(runSpotifyQuery).toHaveBeenCalledTimes(2);
	});

	it('should have content when the refresh fails', async () => {
		vi.mocked(runSpotifyQuery).mockRejectedValue(
			new SpotifyNotReachableError()
		);
		const catalog = new PlaylistCatalog();

		await catalog.refresh();

		expect(catalog.hasContent()).toBe(true);
	});

	it('should have an empty list when the first refresh fails', async () => {
		vi.mocked(runSpotifyQuery).mockRejectedValue(
			new SpotifyNotReachableError()
		);
		const catalog = new PlaylistCatalog();

		await catalog.refresh();

		expect(catalog.playlists).toEqual([]);
	});

	it('should not reject when the refresh fails with an unexpected error', async () => {
		vi.mocked(runSpotifyQuery).mockRejectedValue(new Error('boom'));

		await expect(new PlaylistCatalog().refresh()).resolves.toBeUndefined();
	});

	it('should keep the previous playlists when a later refresh fails', async () => {
		const catalog = new PlaylistCatalog();
		await catalog.refresh();
		vi.mocked(runSpotifyQuery).mockRejectedValue(
			new SpotifyNotReachableError()
		);

		await catalog.refresh();

		expect(catalog.playlists).toEqual(PLAYLISTS);
	});

	it('should be stale before the first refresh', () => {
		expect(new PlaylistCatalog().isStale()).toBe(true);
	});

	it('should not be stale right after a refresh', async () => {
		const catalog = new PlaylistCatalog();

		await catalog.refresh();

		expect(catalog.isStale()).toBe(false);
	});

	it('should not be stale at the maximum age', async () => {
		const catalog = new PlaylistCatalog();
		await catalog.refresh();

		vi.advanceTimersByTime(MAX_AGE_MILLISECONDS);

		expect(catalog.isStale()).toBe(false);
	});

	it('should be stale once older than the maximum age', async () => {
		const catalog = new PlaylistCatalog();
		await catalog.refresh();

		vi.advanceTimersByTime(MAX_AGE_MILLISECONDS + 1);

		expect(catalog.isStale()).toBe(true);
	});
});
