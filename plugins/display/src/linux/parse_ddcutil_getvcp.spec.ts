import { describe, expect, it } from 'vitest';

import { parseDdcutilGetvcp } from './parse_ddcutil_getvcp';
import { readFixture } from './read_fixture';

describe('parseDdcutilGetvcp', () => {
	it('should read the brightness and the power mode of a real capture', () => {
		expect(
			parseDdcutilGetvcp(readFixture('ddcutil_getvcp_iiyama.txt'))
		).toEqual(
			new Map([
				[0x10, { current: 100, maximum: 100 }],
				[0xd6, { current: 1, maximum: 0 }],
			])
		);
	});

	it('should read a brightness alone', () => {
		expect(
			parseDdcutilGetvcp(readFixture('ddcutil_getvcp_brightness_only.txt'))
		).toEqual(new Map([[0x10, { current: 50, maximum: 100 }]]));
	});

	it('should leave out a feature the monitor refuses', () => {
		expect(parseDdcutilGetvcp('VCP 10 ERR\nVCP D6 SNC x05\n')).toEqual(
			new Map([[0xd6, { current: 5, maximum: 0 }]])
		);
	});
});
