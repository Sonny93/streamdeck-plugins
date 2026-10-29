import { describe, expect, it } from 'vitest';

import { percentToSdrWhiteLevel } from './percent_to_sdr_white_level';
import { sdrWhiteLevelToPercent } from './sdr_white_level_to_percent';

describe('SDR white level', () => {
	it('maps the slider of Windows to 80-480 nits', () => {
		expect(percentToSdrWhiteLevel(0)).toBe(1000);
		expect(percentToSdrWhiteLevel(50)).toBe(3500);
		expect(percentToSdrWhiteLevel(100)).toBe(6000);
	});

	it('reads a level back as a slider position, within 0-100', () => {
		expect(sdrWhiteLevelToPercent(3500)).toBe(50);
		expect(sdrWhiteLevelToPercent(500)).toBe(0);
		expect(sdrWhiteLevelToPercent(9000)).toBe(100);
	});
});
