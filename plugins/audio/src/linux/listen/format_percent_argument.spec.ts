import { describe, expect, it } from 'vitest';

import { formatPercentArgument } from './format_percent_argument';
import { InvalidListenLevelError } from './invalid_listen_level_error';

describe('formatPercentArgument', () => {
	it.each([
		[0.08, '8%'],
		[0.085, '8.5%'],
		[0.0849, '8.5%'],
		[0, '0%'],
		[1, '100%'],
	])('should format %s as %s', (level, expected) => {
		expect(formatPercentArgument(level)).toBe(expected);
	});

	it.each([
		[1.5, '100%'],
		[-0.2, '0%'],
	])('should clamp %s to %s', (level, expected) => {
		expect(formatPercentArgument(level)).toBe(expected);
	});

	it('should throw when the level is not a number', () => {
		expect(() => formatPercentArgument(Number.NaN)).toThrow(
			InvalidListenLevelError
		);
	});
});
