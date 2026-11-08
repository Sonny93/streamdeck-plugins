import { describe, expect, it } from 'vitest';

import { listPluginSubsets } from './list_plugin_subsets.ts';

describe('listPluginSubsets', () => {
	it('should list every non-empty subset, the whole set first and the larger subsets before the smaller ones', () => {
		expect(listPluginSubsets({ plugins: ['b', 'c', 'a'] })).toEqual([
			['a', 'b', 'c'],
			['a', 'b'],
			['a', 'c'],
			['b', 'c'],
			['a'],
			['b'],
			['c'],
		]);
	});

	it('should list nothing when there is no plugin', () => {
		expect(listPluginSubsets({ plugins: [] })).toEqual([]);
	});
});
