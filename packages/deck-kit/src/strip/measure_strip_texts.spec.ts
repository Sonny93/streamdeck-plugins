import { describe, expect, it } from 'vitest';

import { measureStripTexts } from './measure_strip_texts';

describe('measureStripTexts', () => {
	it('should span from the origin to the right for a text without anchor', () => {
		const [measured] = measureStripTexts(
			'<text x="12" y="20" fill="#fff" font-family="Arial" font-size="10">AA</text>'
		);

		expect(measured?.left).toBe(12);
		expect(measured?.right).toBeCloseTo(12 + (667 * 2 * 10) / 1000, 5);
	});

	it('should span to the left of the origin for an end anchor and read escaped characters', () => {
		const [measured] = measureStripTexts(
			'<text x="188" y="20" fill="#fff" font-family="Arial" font-size="10" text-anchor="end">l&apos;a</text>'
		);

		expect(measured?.text).toBe("l'a");
		expect(measured?.right).toBe(188);
		expect(measured?.left).toBeLessThan(188);
	});
});
