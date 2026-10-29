import { describe, expect, it } from 'vitest';

import { readDisplayActionConfig } from './read_display_action_config';

describe('readDisplayActionConfig', () => {
	it('falls back to the primary monitor and the defaults', () => {
		expect(readDisplayActionConfig({}, { offersAll: true })).toEqual({
			target: { kind: 'primary' },
			brightnessControl: 'auto',
			offMode: 'blackScreen',
			brightnessKeyMode: 'set',
			value: 50,
			step: 5,
			preset: 50,
		});
	});

	it('reads the picked monitor and the numbers typed as text', () => {
		const config = readDisplayActionConfig(
			{ monitor: 'monitor-id', value: '30', step: '10', preset: 80 },
			{ offersAll: true }
		);

		expect(config.target).toEqual({ kind: 'monitor', monitorId: 'monitor-id' });
		expect([config.value, config.step, config.preset]).toEqual([30, 10, 80]);
	});

	it('only targets every monitor on the actions that offer it', () => {
		expect(
			readDisplayActionConfig({ monitor: 'all' }, { offersAll: true }).target
		).toEqual({
			kind: 'all',
		});
		expect(
			readDisplayActionConfig({ monitor: 'all' }, { offersAll: false }).target
		).toEqual({
			kind: 'primary',
		});
	});

	it('drops the values out of range', () => {
		const config = readDisplayActionConfig(
			{ value: 140, step: 0, offMode: 'sleep' },
			{ offersAll: true }
		);

		expect([config.value, config.step, config.offMode]).toEqual([
			50,
			5,
			'blackScreen',
		]);
	});
});
