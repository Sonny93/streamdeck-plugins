import { describe, expect, it } from 'vitest';

import { estimateTextWidth } from '../text/estimate_text_width';
import { fitStripText } from './fit_strip_text';

const OPTIONS = { fontSize: 14, isBold: true, maxWidth: 120 } as const;

describe('fitStripText', () => {
	it('should keep a text that fits its budget', () => {
		expect(fitStripText({ ...OPTIONS, text: 'PL2530H (top)' })).toBe(
			'PL2530H (top)'
		);
	});

	it('should shorten a text that is too long and end it with an ellipsis', () => {
		const text = fitStripText({
			...OPTIONS,
			text: 'Odyssey G95SD (bottom right) HDMI-A-1',
		});

		expect(text.endsWith('…')).toBe(true);
		expect(text.length).toBeLessThan(
			'Odyssey G95SD (bottom right) HDMI-A-1'.length
		);
	});

	it('should keep the estimated width 12 percent under the budget', () => {
		const text = fitStripText({
			...OPTIONS,
			text: 'Odyssey G95SD (bottom right) HDMI-A-1',
		});

		expect(
			estimateTextWidth({
				text,
				fontSize: OPTIONS.fontSize,
				isBold: OPTIONS.isBold,
			})
		).toBeLessThanOrEqual(OPTIONS.maxWidth * 0.88);
	});

	it('should cut a text that is within the budget but not within the margin', () => {
		const text = 'W'.repeat(11);
		const width = estimateTextWidth({ text, fontSize: 14, isBold: true });
		const maxWidth = width * 1.05;

		expect(
			fitStripText({ text, fontSize: 14, isBold: true, maxWidth })
		).not.toBe(text);
	});
});
