import { describe, expect, it } from 'vitest';

import type { SpotifyPlaylist } from '../spotify/spotify_playlist';
import { resolveSelectedIndex } from './resolve_selected_index';

function buildPlaylist(uri: string): SpotifyPlaylist {
	return {
		uri,
		name: uri,
		imageUrl: undefined,
		kind: 'playlist',
		canAdd: true,
	};
}

const PLAYLISTS = [
	buildPlaylist('spotify:playlist:a'),
	buildPlaylist('spotify:playlist:b'),
	buildPlaylist('spotify:playlist:c'),
];

describe('resolveSelectedIndex', () => {
	it('should return the index of the selected playlist', () => {
		expect(
			resolveSelectedIndex({
				playlists: PLAYLISTS,
				selectedUri: 'spotify:playlist:c',
			})
		).toBe(2);
	});

	it('should fall back to the first playlist when nothing is selected', () => {
		expect(
			resolveSelectedIndex({ playlists: PLAYLISTS, selectedUri: undefined })
		).toBe(0);
	});

	it('should fall back to the first playlist when the selection is no longer listed', () => {
		expect(
			resolveSelectedIndex({
				playlists: PLAYLISTS,
				selectedUri: 'spotify:playlist:gone',
			})
		).toBe(0);
	});

	it('should return 0 for an empty list', () => {
		expect(
			resolveSelectedIndex({ playlists: [], selectedUri: 'spotify:playlist:a' })
		).toBe(0);
	});
});
