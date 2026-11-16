import { describe, expect, it } from 'vitest';

import { ignoresDdcBrightness } from './ignores_ddc_brightness';

describe('ignoresDdcBrightness', () => {
	it('knows the Odyssey G95SD ignores it', () => {
		expect(
			ignoresDdcBrightness({ manufacturerId: 'SAM', productCode: 'E05C' })
		).toBe(true);
	});

	it('trusts the other monitors', () => {
		expect(
			ignoresDdcBrightness({ manufacturerId: 'IVM', productCode: '6133' })
		).toBe(false);
	});

	it('trusts a monitor whose ids are unknown', () => {
		expect(ignoresDdcBrightness({ manufacturerId: '', productCode: '' })).toBe(
			false
		);
	});
});
