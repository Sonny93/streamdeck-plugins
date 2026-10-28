import { describe, expect, it } from 'vitest';

import { formatAppDisplayName } from './format_app_display_name';

describe('formatAppDisplayName', () => {
	it('should drop the executable extension', () => {
		expect(formatAppDisplayName('Spotify.exe')).toBe('Spotify');
	});

	it('should capitalize the first letter', () => {
		expect(formatAppDisplayName('discord.EXE')).toBe('Discord');
	});

	it('should keep a name without extension', () => {
		expect(formatAppDisplayName('Game')).toBe('Game');
	});
});
