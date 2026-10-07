import { describe, expect, it } from 'vitest';

import { moveSelection } from './move_selection';

function move(index: number, ticks: number, length: number): number {
	return moveSelection({ index, ticks, length });
}

describe('moveSelection', () => {
	it('should move forward by the ticks', () => {
		expect(move(2, 3, 10)).toBe(5);
	});

	it('should move backward on negative ticks', () => {
		expect(move(5, -2, 10)).toBe(3);
	});

	it('should wrap from the last item to the first', () => {
		expect(move(9, 1, 10)).toBe(0);
	});

	it('should wrap from the first item to the last on negative ticks', () => {
		expect(move(0, -1, 10)).toBe(9);
	});

	it('should wrap several times when the ticks exceed the length', () => {
		expect(move(1, 23, 10)).toBe(4);
	});

	it('should wrap several times backward on large negative ticks', () => {
		expect(move(1, -23, 10)).toBe(8);
	});

	it('should stay in place on zero ticks', () => {
		expect(move(4, 0, 10)).toBe(4);
	});

	it('should stay on the only item of a single item list', () => {
		expect(move(0, 7, 1)).toBe(0);
	});

	it('should return 0 for an empty list', () => {
		expect(move(0, 3, 0)).toBe(0);
	});
});
