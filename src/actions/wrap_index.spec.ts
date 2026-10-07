import { describe, expect, it } from 'vitest';

import { wrapIndex } from './wrap_index';

describe('wrapIndex', () => {
	it('should keep an index inside the list', () => {
		expect(wrapIndex({ index: 3, length: 5 })).toBe(3);
	});

	it('should wrap past the end', () => {
		expect(wrapIndex({ index: 7, length: 5 })).toBe(2);
	});

	it('should wrap a negative index from the end', () => {
		expect(wrapIndex({ index: -1, length: 5 })).toBe(4);
	});

	it('should wrap a negative index of several laps', () => {
		expect(wrapIndex({ index: -11, length: 5 })).toBe(4);
	});

	it('should round a fractional position towards the nearest index', () => {
		expect(wrapIndex({ index: -0.4, length: 5 })).toBe(0);
		expect(wrapIndex({ index: -0.6, length: 5 })).toBe(4);
	});

	it('should give 0 for an empty list', () => {
		expect(wrapIndex({ index: 4, length: 0 })).toBe(0);
	});
});
