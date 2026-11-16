import { describe, expect, it } from 'vitest';

import { resolvePlaylistName } from './resolve_playlist_name';

describe('resolvePlaylistName', () => {
	it.each([
		['en', 'Liked Songs'],
		['fr', 'Titres likés'],
	] as const)(
		'should name Liked Songs in %s whatever name Spotify gave it',
		(language, expected) => {
			expect(
				resolvePlaylistName({
					playlist: { name: 'Anything', kind: 'liked-songs' },
					language,
				})
			).toBe(expected);
		}
	);

	it('should keep the name of a regular playlist in every language', () => {
		expect(
			resolvePlaylistName({
				playlist: { name: 'Road trip', kind: 'playlist' },
				language: 'fr',
			})
		).toBe('Road trip');
	});
});
