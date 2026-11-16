import { describe, expect, it } from 'vitest';

import { resolveLanguage } from './resolve_language';

describe('resolveLanguage', () => {
	it.each([
		'fr_FR.UTF-8',
		'fr_CA.UTF-8',
		'fr-FR',
		'fr',
		'FR_fr',
		'fr_BE@euro',
		' fr-CH ',
	])('should follow the system into French when it is %s', (locale) => {
		expect(resolveLanguage('system', locale)).toBe('fr');
	});

	it.each([
		'en_US.UTF-8',
		'en-GB',
		'de_DE',
		'ja_JP.UTF-8',
		'fra',
		'frm',
		'C',
		'',
		'xx',
	])('should follow the system into English when it is "%s"', (locale) => {
		expect(resolveLanguage('system', locale)).toBe('en');
	});

	it('should force French whatever the system is', () => {
		expect(resolveLanguage('fr', 'en_US.UTF-8')).toBe('fr');
	});

	it('should force English whatever the system is', () => {
		expect(resolveLanguage('en', 'fr_FR.UTF-8')).toBe('en');
	});
});
