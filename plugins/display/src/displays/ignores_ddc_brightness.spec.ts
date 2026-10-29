import { describe, expect, it } from 'vitest';

import { buildMonitorId } from './build_monitor_id';
import { ignoresDdcBrightness } from './ignores_ddc_brightness';

describe('ignoresDdcBrightness', () => {
	it('knows the Odyssey G95SD ignores it', () => {
		expect(ignoresDdcBrightness(buildMonitorId('SAME05C', 4353))).toBe(true);
	});

	it('trusts the other monitors', () => {
		expect(ignoresDdcBrightness(buildMonitorId('IVM6133', 4355))).toBe(false);
	});
});
