import { describe, expect, it } from 'vitest';

import { readSpecialModeConfig } from './read_special_mode_config';

describe('readSpecialModeConfig', () => {
	it.each([
		['powerful', 'Puissant'],
		['econo', 'Éco'],
	] as const)(
		'should use the name of the %s mode as the label when none is typed',
		(mode, text) => {
			expect(readSpecialModeConfig({ mode })).toEqual({
				mode,
				label: { text, position: 'top' },
			});
		}
	);

	it.each([{}, { mode: 'streamer' }, undefined, null])(
		'should switch powerful when the settings are %j',
		(settings) => {
			expect(readSpecialModeConfig(settings).mode).toBe('powerful');
		}
	);

	it('should use the typed label and its position when there is one', () => {
		const config = readSpecialModeConfig({
			mode: 'econo',
			label: 'Save',
			labelPosition: 'bottom',
		});

		expect(config.label).toEqual({ text: 'Save', position: 'bottom' });
	});
});
