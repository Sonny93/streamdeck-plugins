import { describe, expect, it } from 'vitest';

import { formatPlaylistPosition } from './format_playlist_position';

describe('formatPlaylistPosition', () => {
	it('should show the 1-based position over the total', () => {
		expect(formatPlaylistPosition({ index: 11, total: 39 })).toBe('12 / 39');
	});

	it('should show the first position for index 0', () => {
		expect(formatPlaylistPosition({ index: 0, total: 5 })).toBe('1 / 5');
	});

	it('should show the last position for the last index', () => {
		expect(formatPlaylistPosition({ index: 38, total: 39 })).toBe('39 / 39');
	});

	it('should return an empty string when the list is empty', () => {
		expect(formatPlaylistPosition({ index: 0, total: 0 })).toBe('');
	});
});
