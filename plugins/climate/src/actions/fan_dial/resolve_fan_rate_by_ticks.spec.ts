import { describe, expect, it } from 'vitest';

import type { FanRate } from '../../daikin/unit_types';
import { resolveFanRateByTicks } from './resolve_fan_rate_by_ticks';

describe('resolveFanRateByTicks', () => {
	it.each<[FanRate, number, FanRate]>([
		['auto', 1, 'silent'],
		['silent', 1, 1],
		[2, -1, 1],
		[1, -1, 'silent'],
		['silent', -1, 'auto'],
		['auto', 3, 2],
		[5, -4, 1],
	])('should go from %s by %s ticks to %s', (current, ticks, expected) => {
		expect(resolveFanRateByTicks(current, ticks)).toBe(expected);
	});

	it.each<[FanRate, number, FanRate]>([
		[5, 1, 5],
		[4, 10, 5],
		['auto', -1, 'auto'],
		[2, -10, 'auto'],
	])(
		'should stop at the end of the list when %s moves by %s ticks',
		(current, ticks, expected) => {
			expect(resolveFanRateByTicks(current, ticks)).toBe(expected);
		}
	);
});
