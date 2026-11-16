import { describe, expect, it } from 'vitest';

import { formatKilowattHours } from './format_kilowatt_hours';

describe('formatKilowattHours', () => {
	it.each([
		[0, '0,0'],
		[3.1, '3,1'],
		[0.1 + 0.2, '0,3'],
		[12, '12,0'],
	])('should show %s kWh as %s when there is a value', (value, expected) => {
		expect(formatKilowattHours(value)).toBe(expected);
	});

	it('should show a dash when there is no value', () => {
		expect(formatKilowattHours(undefined)).toBe('–');
	});
});
