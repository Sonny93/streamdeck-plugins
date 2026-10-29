import { describe, expect, it } from 'vitest';

import { buildGammaRamp } from './build_gamma_ramp';
import { readGammaBrightness } from './read_gamma_brightness';

describe('buildGammaRamp', () => {
	it('builds the identity ramp at full brightness', () => {
		const ramp = buildGammaRamp(100);

		expect(ramp).toHaveLength(768);
		expect([ramp[0], ramp[1], ramp[255], ramp[256], ramp[767]]).toEqual([
			0, 257, 65_535, 0, 65_535,
		]);
	});

	it('scales every channel to the brightness', () => {
		const ramp = buildGammaRamp(50);

		expect([ramp[255], ramp[511], ramp[767]]).toEqual([32_768, 32_768, 32_768]);
	});
});

describe('readGammaBrightness', () => {
	it('reads back the brightness of a ramp', () => {
		expect(readGammaBrightness(buildGammaRamp(100))).toBe(100);
		expect(readGammaBrightness(buildGammaRamp(65))).toBe(65);
	});
});
