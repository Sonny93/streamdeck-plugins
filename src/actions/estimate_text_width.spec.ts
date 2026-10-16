import { describe, expect, it } from 'vitest';

import { estimateTextWidth } from './estimate_text_width';

function measure(text: string, isBold = false): number {
	return estimateTextWidth({ text, fontSize: 20, isBold });
}

describe('estimateTextWidth', () => {
	it('should add up the Arial widths of the characters at the font size', () => {
		expect(measure('il')).toBeCloseTo(8.88);
		expect(measure('WM')).toBeCloseTo(35.54);
	});

	it('should use the bold widths for bold text', () => {
		expect(measure('a', true)).toBeCloseTo(11.12);
		expect(measure('b', true)).toBeCloseTo(12.22);
	});

	it('should measure an accented letter as its base letter', () => {
		expect(measure('é')).toBe(measure('e'));
	});

	it('should count a CJK character as a full em', () => {
		expect(measure('愛')).toBe(20);
	});
});
