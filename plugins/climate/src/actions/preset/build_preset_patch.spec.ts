import { describe, expect, it } from 'vitest';

import { buildPresetPatch } from './build_preset_patch';
import { readPresetConfig } from './read_preset_config';

function patchOf(settings: unknown) {
	const config = readPresetConfig(settings);
	if (config.kind === 'invalid') {
		throw new Error('The settings of the test must be valid');
	}
	return buildPresetPatch(config);
}

describe('buildPresetPatch', () => {
	it('should turn the unit on with the mode, the temperature and the fan rate when the preset has a mode', () => {
		expect(
			patchOf({ mode: 'heat', temperature: '22', fanRate: 'silent' })
		).toEqual({
			isPowered: true,
			mode: 'heat',
			targetTemperature: 22,
			fanRate: 'silent',
		});
	});

	it('should send only the mode and the power when the preset has a mode alone', () => {
		expect(patchOf({ mode: 'dry' })).toEqual({ isPowered: true, mode: 'dry' });
	});

	it('should not change the power when the preset has no mode', () => {
		expect(patchOf({ temperature: '23', fanRate: '4' })).toEqual({
			targetTemperature: 23,
			fanRate: 4,
		});
	});
});
