import { describe, expect, it } from 'vitest';

import { readSpecialModeConfig } from './read_special_mode_config';

describe('readSpecialModeConfig', () => {
	it.each(['powerful', 'econo'] as const)(
		'should keep the %s mode and no typed label when none is typed',
		(mode) => {
			expect(readSpecialModeConfig({ mode })).toEqual({
				mode,
				label: { typedText: undefined, position: 'top' },
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

		expect(config.label).toEqual({ typedText: 'Save', position: 'bottom' });
	});
});
