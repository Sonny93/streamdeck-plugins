import { describe, expect, it } from 'vitest';

import { ListenTiming } from '../../listen/listen_timing';
import { parseMaximumLevelPercent } from './parse_maximum_level_percent';

describe('parseMaximumLevelPercent', () => {
	it.each([
		[35, 35],
		['35', 35],
		[' 12,5 ', 12.5],
		[0, 1],
		[-4, 1],
		['250', 100],
	])('should read %j as %j percent', (value, expected) => {
		expect(parseMaximumLevelPercent(value)).toBe(expected);
	});

	it.each([undefined, '', '  ', 'loud', Number.NaN, null, {}])(
		'should give the default for %j',
		(value) => {
			expect(parseMaximumLevelPercent(value)).toBe(
				ListenTiming.defaultMaximumLevelPercent
			);
		}
	);
});
