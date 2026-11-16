import { describe, expect, it } from 'vitest';

import { isTemperatureAllowed } from './is_temperature_allowed';

describe('isTemperatureAllowed', () => {
	it.each([
		['cool', 18, true],
		['cool', 32, true],
		['cool', 17.5, false],
		['cool', 32.5, false],
		['heat', 10, true],
		['heat', 30.5, false],
		['auto', 18, true],
		['auto', 17, false],
	] as const)(
		'should answer for %s at %s degrees when it is %s',
		(mode, temperature, expected) => {
			expect(isTemperatureAllowed(mode, temperature)).toBe(expected);
		}
	);

	it.each(['dry', 'fan'] as const)(
		'should refuse any temperature when the mode is %s',
		(mode) => {
			expect(isTemperatureAllowed(mode, 21)).toBe(false);
		}
	);
});
