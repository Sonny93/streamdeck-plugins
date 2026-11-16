import { describe, expect, it } from 'vitest';

import type { FanDirection } from '../../daikin/unit_types';
import { resolveNextFanDirection } from './resolve_next_fan_direction';

describe('resolveNextFanDirection', () => {
	it.each<[FanDirection, FanDirection]>([
		['fixed', 'both'],
		['both', 'fixed'],
		['vertical', 'fixed'],
		['horizontal', 'fixed'],
	])('should go from %s to %s when the key is pressed', (current, expected) => {
		expect(resolveNextFanDirection(current)).toBe(expected);
	});
});
