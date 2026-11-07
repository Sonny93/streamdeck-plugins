import { describe, expect, it } from 'vitest';

import { InvalidProfileError } from './invalid_profile_error.ts';
import { slugifyProfileName } from './slugify_profile_name.ts';

describe('slugifyProfileName', () => {
	it('should lower-case the name and join its words with dashes', () => {
		expect(slugifyProfileName({ name: 'Spotify Deck' })).toBe('spotify-deck');
	});

	it('should drop accents and punctuation', () => {
		expect(slugifyProfileName({ name: '  Écran / Bureau! ' })).toBe(
			'ecran-bureau'
		);
	});

	it('should fail when nothing is left', () => {
		expect(() => slugifyProfileName({ name: '!!!' })).toThrow(
			InvalidProfileError
		);
	});
});
