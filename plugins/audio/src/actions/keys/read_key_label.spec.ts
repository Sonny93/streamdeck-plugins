import { describe, expect, it } from 'vitest';

import { readKeyLabel } from './read_key_label';

describe('readKeyLabel', () => {
	it('puts the typed label on top unless it is set below', () => {
		expect(readKeyLabel({ label: 'Casque' }, undefined)).toEqual({
			text: 'Casque',
			position: 'top',
		});
		expect(
			readKeyLabel({ label: ' Enceintes ', labelPosition: 'bottom' }, 'Micro')
		).toEqual({ text: 'Enceintes', position: 'bottom' });
	});

	it('falls back to the default label of the action', () => {
		expect(readKeyLabel({}, 'Micro')).toEqual({
			text: 'Micro',
			position: 'top',
		});
		expect(
			readKeyLabel({ label: '  ', labelPosition: 'bottom' }, 'Micro')
		).toEqual({
			text: 'Micro',
			position: 'bottom',
		});
	});

	it('has no label without typed text nor default label', () => {
		expect(readKeyLabel({}, undefined)).toBeUndefined();
		expect(readKeyLabel({ label: 42 }, undefined)).toBeUndefined();
	});
});
