import { describe, expect, it } from 'vitest';

import { readPresetConfig } from './read_preset_config';

describe('readPresetConfig', () => {
	it('should read a mode, a temperature and a fan rate when all are set', () => {
		const config = readPresetConfig({
			mode: 'heat',
			temperature: '22.5',
			fanRate: '3',
		});

		expect(config).toMatchObject({
			kind: 'valid',
			mode: 'heat',
			targetTemperature: 22.5,
			fanRate: 3,
		});
	});

	it('should read a temperature written with a French decimal comma', () => {
		expect(
			readPresetConfig({ mode: 'heat', temperature: '22,5' })
		).toMatchObject({
			kind: 'valid',
			targetTemperature: 22.5,
		});
	});

	it('should read a numeric temperature written as a number', () => {
		expect(readPresetConfig({ mode: 'cool', temperature: 24 })).toMatchObject({
			kind: 'valid',
			targetTemperature: 24,
		});
	});

	it('should treat empty fields as not set', () => {
		const config = readPresetConfig({
			mode: 'cool',
			temperature: '',
			fanRate: ' ',
		});

		expect(config).toMatchObject({
			kind: 'valid',
			mode: 'cool',
			targetTemperature: undefined,
			fanRate: undefined,
		});
	});

	it('should use the mode and the temperature as the label when none is typed', () => {
		const config = readPresetConfig({ mode: 'cool', temperature: '24' });

		expect(config).toMatchObject({
			label: { text: 'Froid 24 °C', position: 'top' },
		});
	});

	it('should use the typed label and its position when there is one', () => {
		const config = readPresetConfig({
			mode: 'cool',
			label: ' Night ',
			labelPosition: 'bottom',
		});

		expect(config).toMatchObject({
			label: { text: 'Night', position: 'bottom' },
		});
	});

	it('should accept a temperature without a mode when it is the only setting', () => {
		expect(readPresetConfig({ temperature: '21' })).toMatchObject({
			kind: 'valid',
			mode: undefined,
			targetTemperature: 21,
		});
	});

	it.each([
		[
			'a temperature below the range of its mode',
			{ mode: 'cool', temperature: '17' },
		],
		[
			'a temperature above the range of its mode',
			{ mode: 'heat', temperature: '31' },
		],
		['a temperature with dry', { mode: 'dry', temperature: '21' }],
		['a temperature with fan', { mode: 'fan', temperature: '21' }],
		[
			'a temperature that is not a half degree step',
			{ mode: 'cool', temperature: '21.3' },
		],
		[
			'a temperature that is not a number',
			{ mode: 'cool', temperature: 'warm' },
		],
		['an unknown mode', { mode: 'turbo' }],
		['an unknown fan rate', { fanRate: '9' }],
		['nothing set', {}],
		['no settings at all', undefined],
	])(
		'should be invalid when the settings have %s',
		(_description, settings) => {
			expect(readPresetConfig(settings)).toEqual({ kind: 'invalid' });
		}
	);
});
