import { describe, expect, it } from 'vitest';

import { isSameImageName } from './is_same_image_name';

describe('isSameImageName', () => {
	it('should ignore the case', () => {
		expect(isSameImageName('Spotify.exe', 'spotify.EXE')).toBe(true);
	});

	it('should match a name saved with .exe against the name without it', () => {
		expect(isSameImageName('firefox.exe', 'firefox')).toBe(true);
	});

	it('should tell two different executables apart', () => {
		expect(isSameImageName('firefox', 'chrome')).toBe(false);
	});

	it('should not strip an .exe that is not at the end', () => {
		expect(isSameImageName('exe.firefox', 'firefox')).toBe(false);
	});
});
