import { describe, expect, it } from 'vitest';

import type { FanRate } from '../../daikin/unit_types';
import { resolveNextFanRate } from './resolve_next_fan_rate';

describe('resolveNextFanRate', () => {
	it.each<[FanRate, FanRate]>([
		['auto', 'silent'],
		['silent', 1],
		[1, 2],
		[2, 3],
		[3, 4],
		[4, 5],
		[5, 'auto'],
	])('should go from %s to %s when the key is pressed', (current, expected) => {
		expect(resolveNextFanRate(current)).toBe(expected);
	});
});
