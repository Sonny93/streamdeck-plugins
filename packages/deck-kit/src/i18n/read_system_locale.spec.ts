import { describe, expect, it, vi } from 'vitest';

import { readSystemLocale } from './read_system_locale';

function read(
	environment: Record<string, string | undefined>,
	intlLocale = 'en-US'
) {
	return readSystemLocale({ environment, readIntlLocale: () => intlLocale });
}

describe('readSystemLocale', () => {
	it('should prefer LC_ALL over LC_MESSAGES and LANG', () => {
		expect(
			read({ LC_ALL: 'fr_FR.UTF-8', LC_MESSAGES: 'de_DE', LANG: 'en_US' })
		).toBe('fr_FR.UTF-8');
	});

	it('should prefer LC_MESSAGES over LANG when LC_ALL is not set', () => {
		expect(read({ LC_MESSAGES: 'fr_CA.UTF-8', LANG: 'en_US.UTF-8' })).toBe(
			'fr_CA.UTF-8'
		);
	});

	it('should use LANG when it is the only one set', () => {
		expect(read({ LANG: 'fr_FR.UTF-8' })).toBe('fr_FR.UTF-8');
	});

	it('should skip a variable that is set but empty', () => {
		expect(read({ LC_ALL: '', LANG: 'fr_FR.UTF-8' })).toBe('fr_FR.UTF-8');
	});

	it.each(['C', 'POSIX', 'C.UTF-8', 'C.utf8'])(
		'should fall back to the runtime locale when the one found is %s',
		(value) => {
			expect(read({ LANG: value }, 'fr-FR')).toBe('fr-FR');
		}
	);

	it('should fall back to the runtime locale when no variable is set, as on Windows', () => {
		expect(read({}, 'fr-FR')).toBe('fr-FR');
	});

	it('should not read the runtime locale when a variable gives one', () => {
		const readIntlLocale = vi.fn(() => 'en-US');

		readSystemLocale({ environment: { LANG: 'fr_FR.UTF-8' }, readIntlLocale });

		expect(readIntlLocale).not.toHaveBeenCalled();
	});

	it('should stop at the first variable even when it is C, and not look at the next ones', () => {
		expect(read({ LC_ALL: 'C', LANG: 'fr_FR.UTF-8' }, 'en-GB')).toBe('en-GB');
	});
});
