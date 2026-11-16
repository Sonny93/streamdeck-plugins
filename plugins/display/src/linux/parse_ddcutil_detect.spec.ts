import { describe, expect, it } from 'vitest';

import { parseDdcutilDetect } from './parse_ddcutil_detect';
import { readFixture } from './read_fixture';

describe('parseDdcutilDetect', () => {
	it('should map each connector to its bus without the card prefix', () => {
		expect(parseDdcutilDetect(readFixture('ddcutil_detect_terse.txt'))).toEqual(
			new Map([
				['DP-4', 12],
				['DP-5', 13],
				['DP-6', 14],
			])
		);
	});

	it('should skip a display without a DRM connector', () => {
		expect(
			parseDdcutilDetect(
				'Display 1\n   I2C bus:          /dev/i2c-3\n   Monitor:          X:Y:Z\n'
			)
		).toEqual(new Map());
	});

	it('should give nothing when no display is found', () => {
		expect(parseDdcutilDetect('No displays found.\n')).toEqual(new Map());
	});
});
