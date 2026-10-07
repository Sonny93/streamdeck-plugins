import { describe, expect, it } from 'vitest';

import { buildPlaylistFeedback } from './build_playlist_feedback';
import type { SpotifyPlaylist } from '../spotify/spotify_playlist';

const FALLBACK_COVER = 'imgs/actions/playlists/liked-songs.svg';
const HEART = 'imgs/actions/playlists/heart.svg';

const PLAYLIST: SpotifyPlaylist = {
	uri: 'spotify:playlist:a',
	name: 'Road trip',
	imageUrl: 'https://i.scdn.co/image/abc',
	kind: 'playlist',
	canAdd: true,
};

function build(
	overrides: Partial<Parameters<typeof buildPlaylistFeedback>[0]>
) {
	return buildPlaylistFeedback({
		playlist: PLAYLIST,
		index: 11,
		total: 39,
		isLikeTarget: false,
		coverDataUrl: undefined,
		...overrides,
	});
}

describe('buildPlaylistFeedback', () => {
	it('should show the playlist name as title', () => {
		expect(build({})['title']).toBe('Road trip');
	});

	it('should show the position of the playlist', () => {
		expect(build({})['position']).toBe('12 / 39');
	});

	it('should show the cover data url when it is available', () => {
		expect(
			build({ coverDataUrl: 'data:image/jpeg;base64,AQID' })['cover']
		).toBe('data:image/jpeg;base64,AQID');
	});

	it('should fall back to the liked songs image while the cover is missing', () => {
		expect(build({})['cover']).toBe(FALLBACK_COVER);
	});

	it('should show the heart when the playlist is the like target', () => {
		expect(build({ isLikeTarget: true })['target']).toEqual({
			value: HEART,
			enabled: true,
		});
	});

	it('should hide the heart when the playlist is not the like target', () => {
		expect(build({ isLikeTarget: false })['target']).toEqual({
			value: '',
			enabled: false,
		});
	});

	it('should say Spotify is closed when there is no playlist', () => {
		expect(build({ playlist: undefined })['title']).toBe('Spotify closed');
	});

	it('should clear the position when there is no playlist', () => {
		expect(build({ playlist: undefined })['position']).toBe('');
	});

	it('should show the fallback cover when there is no playlist', () => {
		expect(build({ playlist: undefined })['cover']).toBe(FALLBACK_COVER);
	});

	it('should hide the heart when there is no playlist', () => {
		expect(
			build({ playlist: undefined, isLikeTarget: true })['target']
		).toEqual({
			value: '',
			enabled: false,
		});
	});
});
