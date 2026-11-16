import { describe, expect, it } from 'vitest';

import { displayMessages } from './display_messages';

const LANGUAGES = ['en', 'fr'] as const;
const PLACEHOLDER = /\{(\w+)\}/gu;

function listPlaceholders(text: string): readonly string[] {
	return [...text.matchAll(PLACEHOLDER)]
		.map((match) => match[1] ?? '')
		.toSorted();
}

describe('the messages of the plugin', () => {
	it.each(displayMessages.keys())(
		'should have a text in every language for %s',
		(key) => {
			for (const language of LANGUAGES) {
				expect(
					displayMessages.raw(key, language).trim(),
					`${key} in ${language}`
				).not.toBe('');
			}
		}
	);

	it.each(displayMessages.keys())(
		'should use the same placeholders in every language for %s',
		(key) => {
			expect(listPlaceholders(displayMessages.raw(key, 'en'))).toEqual(
				listPlaceholders(displayMessages.raw(key, 'fr'))
			);
		}
	);
});
