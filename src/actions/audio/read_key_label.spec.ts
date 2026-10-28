import { describe, expect, it } from 'vitest';

import { readKeyLabel } from './read_key_label';

describe('readKeyLabel', () => {
	it('puts the label on top unless it is set below', () => {
		expect(readKeyLabel({ label: 'Casque' })).toEqual({
			text: 'Casque',
			position: 'top',
		});
		expect(
			readKeyLabel({ label: ' Enceintes ', labelPosition: 'bottom' })
		).toEqual({ text: 'Enceintes', position: 'bottom' });
	});

	it('has no label without text', () => {
		expect(readKeyLabel({})).toBeUndefined();
		expect(readKeyLabel({ label: '  ' })).toBeUndefined();
		expect(readKeyLabel({ label: 42 })).toBeUndefined();
	});
});
