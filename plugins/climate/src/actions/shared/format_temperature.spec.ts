import { describe, expect, it } from 'vitest';

import { formatCompactTemperature } from './format_compact_temperature';
import { formatTemperature } from './format_temperature';

describe('formatTemperature', () => {
	it('should show whole degrees without decimals when the temperature is an integer', () => {
		expect(formatTemperature(23)).toBe('23 °C');
	});

	it('should show one decimal with a comma when the temperature is a half degree', () => {
		expect(formatTemperature(21.5)).toBe('21,5 °C');
	});

	it.each([null, undefined])(
		'should show a dash when the temperature is %s',
		(temperature) => {
			expect(formatTemperature(temperature)).toBe('–');
		}
	);
});

describe('formatCompactTemperature', () => {
	it.each([
		[23, '23°'],
		[23.5, '23,5°'],
		[-3.5, '-3,5°'],
		[null, '–'],
		[undefined, '–'],
	])('should show %s as %s', (temperature, expected) => {
		expect(formatCompactTemperature(temperature)).toBe(expected);
	});
});
