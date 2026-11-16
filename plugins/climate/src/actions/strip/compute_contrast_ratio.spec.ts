import { describe, expect, it } from 'vitest';

import { computeContrastRatio } from './compute_contrast_ratio';

describe('computeContrastRatio', () => {
	it('should be 21 between black and white', () => {
		expect(computeContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
	});

	it('should be 1 between a color and itself', () => {
		expect(computeContrastRatio('#5EEAD4', '#5EEAD4')).toBeCloseTo(1, 5);
	});

	it('should not depend on the order of the colors', () => {
		expect(computeContrastRatio('#123456', '#FEDCBA')).toBe(
			computeContrastRatio('#FEDCBA', '#123456')
		);
	});
});
