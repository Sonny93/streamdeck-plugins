import { describe, expect, it } from 'vitest';

import { formatCompactTemperature } from './format_compact_temperature';
import { formatKilowattHours } from './format_kilowatt_hours';
import { formatTemperature } from './format_temperature';

describe('formatTemperature', () => {
	it('should show whole degrees without decimals when the temperature is an integer', () => {
		expect(formatTemperature(23, 'fr')).toBe('23 °C');
	});

	it('should show one decimal with a comma when the temperature is a half degree', () => {
		expect(formatTemperature(21.5, 'fr')).toBe('21,5 °C');
	});

	it.each([null, undefined])(
		'should show a dash when the temperature is %s',
		(temperature) => {
			expect(formatTemperature(temperature, 'fr')).toBe('–');
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
		expect(formatCompactTemperature(temperature, 'fr')).toBe(expected);
	});
});

describe('English number formats', () => {
	it.each([
		[21.5, '21.5 °C'],
		[23, '23 °C'],
	])('should write %s as %s', (temperature, expected) => {
		expect(formatTemperature(temperature, 'en')).toBe(expected);
	});

	it('should write the compact temperature with a point', () => {
		expect(formatCompactTemperature(21.5, 'en')).toBe('21.5°');
	});

	it('should write the energy with a point', () => {
		expect(formatKilowattHours(1.2, 'en')).toBe('1.2');
	});
});
