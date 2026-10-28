import { describe, expect, it } from 'vitest';

import { splitMultiString } from './split_multi_string';

describe('splitMultiString', () => {
	it('returns each string of the list', () => {
		expect(splitMultiString('first\0second\0\0')).toEqual(['first', 'second']);
	});

	it('returns nothing for an empty list', () => {
		expect(splitMultiString('\0')).toEqual([]);
	});
});
