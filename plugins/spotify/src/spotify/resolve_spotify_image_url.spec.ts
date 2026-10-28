import { describe, expect, it } from 'vitest';

import { resolveSpotifyImageUrl } from './resolve_spotify_image_url';

describe('resolveSpotifyImageUrl', () => {
	it('should return an https url as is', () => {
		expect(resolveSpotifyImageUrl('https://example.com/cover.jpg')).toBe(
			'https://example.com/cover.jpg'
		);
	});

	it('should resolve a spotify image uri to the image cdn', () => {
		expect(resolveSpotifyImageUrl('spotify:image:ab67706f00000001abc')).toBe(
			'https://i.scdn.co/image/ab67706f00000001abc'
		);
	});

	it('should resolve a spotify mosaic uri by concatenating its ids', () => {
		expect(resolveSpotifyImageUrl('spotify:mosaic:aaa:bbb:ccc:ddd')).toBe(
			'https://mosaic.scdn.co/60/aaabbbcccddd'
		);
	});

	it('should resolve a mosaic uri that holds a single id', () => {
		expect(resolveSpotifyImageUrl('spotify:mosaic:aaa')).toBe(
			'https://mosaic.scdn.co/60/aaa'
		);
	});

	it('should use the small album cover variant for an album size prefix', () => {
		expect(resolveSpotifyImageUrl('spotify:image:ab67616d0000b273abc')).toBe(
			'https://i.scdn.co/image/ab67616d00004851abc'
		);
		expect(resolveSpotifyImageUrl('spotify:image:ab67616d00001e02abc')).toBe(
			'https://i.scdn.co/image/ab67616d00004851abc'
		);
	});

	it('should use the small playlist cover variant for a playlist size prefix', () => {
		expect(resolveSpotifyImageUrl('spotify:image:ab67706c0000da84abc')).toBe(
			'https://i.scdn.co/image/ab67706c0000d72cabc'
		);
		expect(resolveSpotifyImageUrl('spotify:image:ab67706c0000bebbabc')).toBe(
			'https://i.scdn.co/image/ab67706c0000d72cabc'
		);
	});

	it('should swap the size prefix of an i.scdn.co url', () => {
		expect(
			resolveSpotifyImageUrl('https://i.scdn.co/image/ab67616d0000b273abc')
		).toBe('https://i.scdn.co/image/ab67616d00004851abc');
	});

	it('should use the small generated playlist cover variant for its standard prefix', () => {
		expect(
			resolveSpotifyImageUrl('https://i.scdn.co/image/ab67706f00000002abc')
		).toBe('https://i.scdn.co/image/ab67706f00000001abc');
	});

	it('should keep an i.scdn.co image with an unknown prefix', () => {
		expect(
			resolveSpotifyImageUrl('https://i.scdn.co/image/ab67706f00000001abc')
		).toBe('https://i.scdn.co/image/ab67706f00000001abc');
	});

	it('should keep an id shorter than a size prefix', () => {
		expect(resolveSpotifyImageUrl('spotify:image:abc')).toBe(
			'https://i.scdn.co/image/abc'
		);
	});

	it('should not touch the size prefix of another host', () => {
		expect(
			resolveSpotifyImageUrl('https://example.com/image/ab67616d0000b273abc')
		).toBe('https://example.com/image/ab67616d0000b273abc');
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
