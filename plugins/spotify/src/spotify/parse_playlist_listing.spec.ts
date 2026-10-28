import { describe, expect, it } from 'vitest';

import { parsePlaylistListing } from './parse_playlist_listing';
import { SpotifyEvaluationError } from './spotify_evaluation_error';

const LIKED_SONGS_URI = 'spotify:playlist:liked';

function buildListing(playlists: unknown[]) {
	return { likedSongsUri: LIKED_SONGS_URI, playlists };
}

function buildRawPlaylist(overrides: Record<string, unknown> = {}) {
	return {
		uri: 'spotify:playlist:a',
		name: 'Road trip',
		imageUrl: 'spotify:image:abc',
		canAdd: true,
		isOwnedBySelf: true,
		...overrides,
	};
}

describe('parsePlaylistListing', () => {
	it('should put the liked songs entry first', () => {
		const result = parsePlaylistListing(buildListing([buildRawPlaylist()]));

		expect(result[0]).toEqual({
			uri: LIKED_SONGS_URI,
			name: 'Liked Songs',
			imageUrl: undefined,
			kind: 'liked-songs',
			canAdd: true,
		});
	});

	it('should return only the liked songs entry when the library has no playlist', () => {
		expect(parsePlaylistListing(buildListing([]))).toHaveLength(1);
	});

	it('should keep the playlists in their order after the liked songs', () => {
		const result = parsePlaylistListing(
			buildListing([
				buildRawPlaylist({ uri: 'spotify:playlist:a', name: 'A' }),
				buildRawPlaylist({ uri: 'spotify:playlist:b', name: 'B' }),
			])
		);

		expect(result.map((playlist) => playlist.name)).toEqual([
			'Liked Songs',
			'A',
			'B',
		]);
	});

	it('should list the owned playlists before the other ones, keeping the library order in each group', () => {
		const result = parsePlaylistListing(
			buildListing([
				buildRawPlaylist({ name: 'Mix 1', isOwnedBySelf: false }),
				buildRawPlaylist({ name: 'Mine 1' }),
				buildRawPlaylist({ name: 'Radio', isOwnedBySelf: false }),
				buildRawPlaylist({ name: 'Mine 2' }),
				buildRawPlaylist({ name: 'Followed', isOwnedBySelf: false }),
			])
		);

		expect(result.map((playlist) => playlist.name)).toEqual([
			'Liked Songs',
			'Mine 1',
			'Mine 2',
			'Mix 1',
			'Radio',
			'Followed',
		]);
	});

	it('should keep the liked songs entry first when no playlist is owned', () => {
		const result = parsePlaylistListing(
			buildListing([buildRawPlaylist({ isOwnedBySelf: false })])
		);

		expect(result[0]?.kind).toBe('liked-songs');
	});

	it('should throw an evaluation error when the owned flag is missing', () => {
		const playlist = { ...buildRawPlaylist(), isOwnedBySelf: undefined };

		expect(() => parsePlaylistListing(buildListing([playlist]))).toThrow(
			SpotifyEvaluationError
		);
	});

	it('should mark a library playlist with the playlist kind', () => {
		const result = parsePlaylistListing(buildListing([buildRawPlaylist()]));

		expect(result[1]?.kind).toBe('playlist');
	});

	it('should keep the addable flag of a playlist', () => {
		const result = parsePlaylistListing(
			buildListing([buildRawPlaylist({ canAdd: false })])
		);

		expect(result[1]?.canAdd).toBe(false);
	});

	it('should resolve the image reference of a playlist', () => {
		const result = parsePlaylistListing(buildListing([buildRawPlaylist()]));

		expect(result[1]?.imageUrl).toBe('https://i.scdn.co/image/abc');
	});

	it('should give an undefined image when the playlist has no image', () => {
		const result = parsePlaylistListing(
			buildListing([buildRawPlaylist({ imageUrl: null })])
		);

		expect(result[1]?.imageUrl).toBeUndefined();
	});

	it('should give an undefined image when the image scheme is unknown', () => {
		const result = parsePlaylistListing(
			buildListing([buildRawPlaylist({ imageUrl: 'ftp://nope' })])
		);

		expect(result[1]?.imageUrl).toBeUndefined();
	});

	it('should throw an evaluation error when a playlist name is not a string', () => {
		expect(() =>
			parsePlaylistListing(buildListing([buildRawPlaylist({ name: 3 })]))
		).toThrow(SpotifyEvaluationError);
	});

	it('should throw an evaluation error when the liked songs uri is missing', () => {
		expect(() => parsePlaylistListing({ playlists: [] })).toThrow(
			SpotifyEvaluationError
		);
	});

	it('should throw an evaluation error when the listing is not an object', () => {
		expect(() => parsePlaylistListing('nope')).toThrow(SpotifyEvaluationError);
	});
});
