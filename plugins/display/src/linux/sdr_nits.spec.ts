import { describe, expect, it } from 'vitest';

import { percentToSdrNits } from './percent_to_sdr_nits';
import { sdrNitsToPercent } from './sdr_nits_to_percent';

describe('SDR nits and percent', () => {
	it('should map 0 % to 100 nits and 100 % to 1000 nits', () => {
		expect([percentToSdrNits(0), percentToSdrNits(100)]).toEqual([100, 1000]);
	});

	it('should read 550 nits as 50 %', () => {
		expect(sdrNitsToPercent(550)).toBe(50);
	});

	it('should keep a percent unchanged after a round trip', () => {
		expect(sdrNitsToPercent(percentToSdrNits(37))).toBe(37);
	});

	it('should clamp nits out of range', () => {
		expect([sdrNitsToPercent(50), sdrNitsToPercent(5000)]).toEqual([0, 100]);
	});
});
