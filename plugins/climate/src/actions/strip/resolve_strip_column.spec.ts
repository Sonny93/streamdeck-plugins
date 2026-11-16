import { describe, expect, it } from 'vitest';

import { resolveStripColumn } from './resolve_strip_column';

describe('resolveStripColumn', () => {
	it.each([0, 1, 2, 3])(
		'should keep column %s when it is a slot of the strip',
		(column) => {
			expect(resolveStripColumn({ column })).toBe(column);
		}
	);

	it('should default to the first column when there are no coordinates', () => {
		expect(resolveStripColumn(undefined)).toBe(0);
	});

	it.each([-1, 4, 1.5, Number.NaN])(
		'should default to the first column when the column is %s',
		(column) => {
			expect(resolveStripColumn({ column })).toBe(0);
		}
	);
});
