import { describe, expect, it } from 'vitest';

import { climateMessages } from './climate_messages';

const LANGUAGES = ['en', 'fr'] as const;
const PLACEHOLDER = /\{(\w+)\}/gu;

function listPlaceholders(text: string): readonly string[] {
	return [...text.matchAll(PLACEHOLDER)]
		.map((match) => match[1] ?? '')
		.toSorted();
}

describe('the messages of the plugin', () => {
	it.each(climateMessages.keys())(
		'should have a text in every language for %s',
		(key) => {
			for (const language of LANGUAGES) {
				expect(
					climateMessages.raw(key, language).trim(),
					`${key} in ${language}`
				).not.toBe('');
			}
		}
	);

	it.each(climateMessages.keys())(
		'should use the same placeholders in every language for %s',
		(key) => {
			expect(listPlaceholders(climateMessages.raw(key, 'en'))).toEqual(
				listPlaceholders(climateMessages.raw(key, 'fr'))
			);
		}
	);

	it('should have no dash used as a sentence break in any text', () => {
		for (const key of climateMessages.keys()) {
			for (const language of LANGUAGES) {
				expect(
					climateMessages.raw(key, language),
					`${key} in ${language}`
				).not.toContain('—');
			}
		}
	});
});
