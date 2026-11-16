import { describe, expect, it } from 'vitest';

import { describeSaveOutcome } from './describe_save_outcome';

describe('describeSaveOutcome', () => {
	it.each([
		['saved', 'fr', 'Adresse enregistrée.'],
		['saved', 'en', 'Address saved.'],
		['no-answer', 'fr', "L'unité ne répond pas à cette adresse."],
		['no-answer', 'en', 'The unit does not answer at this address.'],
		['incompatible', 'en', 'This is not a Daikin unit with the local API.'],
	] as const)(
		'should describe the outcome %s in %s',
		(outcome, language, expected) => {
			expect(describeSaveOutcome(outcome, language)).toBe(expected);
		}
	);

	it.each(['fr', 'en'] as const)(
		'should describe every outcome in %s with a text',
		(language) => {
			for (const outcome of [
				'saved',
				'invalid',
				'no-answer',
				'incompatible',
			] as const) {
				expect(describeSaveOutcome(outcome, language).length).toBeGreaterThan(
					0
				);
			}
		}
	);
});
