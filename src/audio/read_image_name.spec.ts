import { describe, expect, it } from 'vitest';

import { readImageName } from './read_image_name';

describe('readImageName', () => {
	it('should keep the last segment of a Windows path', () => {
		expect(readImageName('C:\\Program Files\\Spotify\\Spotify.exe')).toBe(
			'Spotify.exe'
		);
	});

	it('should accept forward slashes', () => {
		expect(readImageName('C:/Games/game.exe')).toBe('game.exe');
	});

	it('should keep a bare executable name', () => {
		expect(readImageName('steam.exe')).toBe('steam.exe');
	});
});
