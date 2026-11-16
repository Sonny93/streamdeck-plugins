import { describe, expect, it } from 'vitest';

import { MessageCatalog } from './message_catalog';
import { MessageParameterError } from './message_parameter_error';

const catalog = new MessageCatalog({
	hello: { en: 'Hello', fr: 'Bonjour' },
	greeting: {
		en: 'Hello {name}, {count} new',
		fr: 'Bonjour {name}, {count} nouveaux',
	},
});

describe('MessageCatalog', () => {
	it.each([
		['en', 'Hello'],
		['fr', 'Bonjour'],
	] as const)('should return the message in %s', (language, expected) => {
		expect(catalog.text('hello', language)).toBe(expected);
	});

	it('should fill the named parameters of a message', () => {
		expect(catalog.text('greeting', 'fr', { name: 'Zoé', count: 3 })).toBe(
			'Bonjour Zoé, 3 nouveaux'
		);
	});

	it('should fill a placeholder that appears twice with the same value', () => {
		const twice = new MessageCatalog({
			echo: { en: '{x} {x}', fr: '{x} {x}' },
		});

		expect(twice.text('echo', 'en', { x: 'a' })).toBe('a a');
	});

	it('should throw a typed error when a placeholder has no value', () => {
		expect(() => catalog.text('greeting', 'en', { name: 'Zoé' })).toThrow(
			MessageParameterError
		);
	});

	it('should list the keys of the catalog', () => {
		expect(catalog.keys()).toEqual(['hello', 'greeting']);
	});

	it('should give the raw text with its placeholders', () => {
		expect(catalog.raw('greeting', 'en')).toBe('Hello {name}, {count} new');
	});

	it('should refuse a key that lacks a language when the catalog is declared', () => {
		// @ts-expect-error the French text is missing
		const incomplete = new MessageCatalog({ hello: { en: 'Hello' } });

		expect(incomplete.keys()).toEqual(['hello']);
	});
});
