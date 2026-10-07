import { describe, expect, it } from 'vitest';

import { resolveSpotifyImageUrl } from './resolve_spotify_image_url';

describe('resolveSpotifyImageUrl', () => {
	it('should return an https url as is', () => {
		expect(resolveSpotifyImageUrl('https://example.com/cover.jpg')).toBe(
			'https://example.com/cover.jpg'
		);
	});

	it('should resolve a spotify image uri to the image cdn', () => {
		expect(resolveSpotifyImageUrl('spotify:image:ab67616d0000b273')).toBe(
			'https://i.scdn.co/image/ab67616d0000b273'
		);
	});

	it('should resolve a spotify mosaic uri by concatenating its ids', () => {
		expect(resolveSpotifyImageUrl('spotify:mosaic:aaa:bbb:ccc:ddd')).toBe(
			'https://mosaic.scdn.co/300/aaabbbcccddd'
		);
	});

	it('should resolve a mosaic uri that holds a single id', () => {
		expect(resolveSpotifyImageUrl('spotify:mosaic:aaa')).toBe(
			'https://mosaic.scdn.co/300/aaa'
		);
	});

	it('should return undefined for an image uri without id', () => {
		expect(resolveSpotifyImageUrl('spotify:image:')).toBeUndefined();
	});

	it('should return undefined for a mosaic uri without id', () => {
		expect(resolveSpotifyImageUrl('spotify:mosaic:')).toBeUndefined();
	});

	it('should return undefined for an unknown scheme', () => {
		expect(
			resolveSpotifyImageUrl('ftp://example.com/cover.jpg')
		).toBeUndefined();
	});

	it('should return undefined for an insecure http url', () => {
		expect(
			resolveSpotifyImageUrl('http://example.com/cover.jpg')
		).toBeUndefined();
	});

	it('should return undefined for an empty string', () => {
		expect(resolveSpotifyImageUrl('')).toBeUndefined();
	});
});
