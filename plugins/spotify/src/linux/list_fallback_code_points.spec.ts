import { describe, expect, it } from 'vitest';

import { listFallbackCodePoints } from './list_fallback_code_points';

describe('listFallbackCodePoints', () => {
	it('should list nothing for Latin text with accents and quotes', () => {
		expect(listFallbackCodePoints('<text>Été “déjà” vu</text>')).toStrictEqual(
			[]
		);
	});

	it('should list each distinct Japanese character once', () => {
		expect(listFallbackCodePoints('<text>夜夜に</text>')).toStrictEqual([
			0x591c, 0x306b,
		]);
	});

	it('should list an emoji as one code point', () => {
		expect(listFallbackCodePoints('<text>Party 🎉</text>')).toStrictEqual([
			0x1f389,
		]);
	});

	it('should stop at 32 distinct characters', () => {
		const text = Array.from({ length: 100 }, (_, index) =>
			String.fromCodePoint(0x4e00 + index)
		).join('');

		expect(listFallbackCodePoints(text)).toHaveLength(32);
	});
});
