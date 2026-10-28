import { describe, expect, it } from 'vitest';

import { fitText } from './fit_text';

function fitsIn(maxLength: number): (text: string) => boolean {
	return (text) => Array.from(text).length <= maxLength;
}

describe('fitText', () => {
	it('should keep a text that fits', () => {
		expect(fitText({ text: 'Road trip', fits: fitsIn(9) })).toBe('Road trip');
	});

	it('should shorten a text that does not fit and end it with an ellipsis', () => {
		expect(fitText({ text: 'Road trip 2024', fits: fitsIn(10) })).toBe(
			'Road trip…'
		);
	});

	it('should give a lone ellipsis when nothing else fits', () => {
		expect(fitText({ text: 'Road', fits: fitsIn(1) })).toBe('…');
	});
});
