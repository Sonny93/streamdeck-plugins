import { describe, expect, it } from 'vitest';

import { readKeyLabelPreferences } from './read_key_label_preferences';
import { resolveKeyLabel } from './resolve_key_label';

describe('readKeyLabelPreferences', () => {
	it('should read the typed text without surrounding spaces and the position', () => {
		expect(
			readKeyLabelPreferences({ label: ' Night ', labelPosition: 'bottom' })
		).toEqual({
			typedText: 'Night',
			position: 'bottom',
		});
	});

	it.each([{}, { label: '  ' }, undefined, null, { label: 3 }])(
		'should have no text and the top position when the settings are %j',
		(settings) => {
			expect(readKeyLabelPreferences(settings)).toEqual({
				typedText: undefined,
				position: 'top',
			});
		}
	);
});

describe('resolveKeyLabel', () => {
	it('should use the typed text when there is one', () => {
		expect(
			resolveKeyLabel({ typedText: 'Night', position: 'top' }, 'Cool')
		).toEqual({ text: 'Night', position: 'top' });
	});

	it('should use the default text when none is typed', () => {
		expect(
			resolveKeyLabel({ typedText: undefined, position: 'bottom' }, 'Cool')
		).toEqual({ text: 'Cool', position: 'bottom' });
	});
});
