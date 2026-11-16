import { describe, expect, it } from 'vitest';

import { formatDecimal } from './format_decimal';

describe('formatDecimal', () => {
	it.each([
		[21.5, 1, 'fr', '21,5'],
		[21.5, 1, 'en', '21.5'],
		[0, 1, 'fr', '0,0'],
		[0.1 + 0.2, 1, 'en', '0.3'],
		[12, 0, 'fr', '12'],
		[-3.25, 2, 'fr', '-3,25'],
	] as const)(
		'should format %s with %s decimals in %s as %s',
		(value, digits, language, expected) => {
			expect(formatDecimal(value, digits, language)).toBe(expected);
		}
	);
});
