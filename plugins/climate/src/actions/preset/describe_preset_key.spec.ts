import { describe, expect, it } from 'vitest';

import { buildClimateViewForTest } from '../../climate/build_climate_view_for_test';
import type { UnitState } from '../../daikin/unit_types';
import { KeyState } from '../keys/key_state';
import { describePresetKey } from './describe_preset_key';
import { readPresetConfig } from './read_preset_config';

function describeWith(settings: unknown, state: Partial<UnitState> = {}) {
	return describePresetKey(
		buildClimateViewForTest({ state }),
		readPresetConfig(settings),
		'fr'
	);
}

describe('describePresetKey', () => {
	it('should be lit when the unit is on and matches every field of the preset', () => {
		const description = describeWith(
			{ mode: 'cool', temperature: '21', fanRate: 'auto' },
			{ mode: 'cool', targetTemperature: 21, fanRate: 'auto' }
		);

		expect(description.state).toBe(KeyState.on);
	});

	it('should show the label of the preset when it is lit', () => {
		const description = describeWith({ mode: 'cool', temperature: '21' });

		expect(description.label?.text).toBe('Froid 21 °C');
	});

	it.each([
		['mode', { mode: 'heat' }, { mode: 'cool' }],
		[
			'temperature',
			{ mode: 'cool', temperature: '22' },
			{ targetTemperature: 21 },
		],
		['fan rate', { mode: 'cool', fanRate: '3' }, { fanRate: 'auto' }],
	] as const)(
		'should be off when the %s differs',
		(_field, settings, state) => {
			expect(describeWith(settings, state).state).toBe(KeyState.off);
		}
	);

	it('should be off when the unit is off even if everything matches', () => {
		const description = describeWith(
			{ mode: 'cool', temperature: '21' },
			{ isPowered: false }
		);

		expect(description.state).toBe(KeyState.off);
	});

	it('should ignore the mode and the power-independent fields it does not specify when matching', () => {
		const description = describeWith(
			{ fanRate: '2' },
			{ mode: 'heat', fanRate: 2 }
		);

		expect(description.state).toBe(KeyState.on);
	});

	it('should be unavailable when the settings are invalid', () => {
		const description = describeWith({ mode: 'dry', temperature: '21' });

		expect(description.state).toBe(KeyState.unavailable);
		expect(description.label).toBeUndefined();
	});

	it('should be unavailable when a preset without mode has a temperature the current mode cannot take', () => {
		const description = describeWith(
			{ temperature: '21' },
			{ mode: 'dry', targetTemperature: null }
		);

		expect(description.state).toBe(KeyState.unavailable);
	});

	it('should be unavailable when the unit is not ready', () => {
		const description = describePresetKey(
			buildClimateViewForTest({ status: 'unreachable' }),
			readPresetConfig({ mode: 'cool' }),
			'fr'
		);

		expect(description.state).toBe(KeyState.unavailable);
	});
});

describe('describePresetKey labels', () => {
	it.each([
		[{ mode: 'cool', temperature: '22' }, 'fr', 'Froid 22 °C'],
		[{ mode: 'cool', temperature: '22' }, 'en', 'Cool 22 °C'],
		[{ mode: 'heat', temperature: '22,5' }, 'fr', 'Chaud 22,5 °C'],
		[{ mode: 'heat', temperature: '22.5' }, 'en', 'Heat 22.5 °C'],
		[{ mode: 'dry' }, 'fr', 'Déshu.'],
		[{ mode: 'dry' }, 'en', 'Dry'],
		[{ fanRate: '3' }, 'fr', 'Ventil. 3'],
		[{ fanRate: '3' }, 'en', 'Fan 3'],
		[{ fanRate: 'silent' }, 'fr', 'Ventil. Silence'],
		[{ fanRate: 'silent' }, 'en', 'Fan Silent'],
	] as const)(
		'should label a preset %j in %s as %s when no label is typed',
		(settings, language, expected) => {
			const description = describePresetKey(
				buildClimateViewForTest(),
				readPresetConfig(settings),
				language
			);

			expect(description.label?.text).toBe(expected);
		}
	);

	it.each(['fr', 'en'] as const)(
		'should keep the typed label in %s',
		(language) => {
			const description = describePresetKey(
				buildClimateViewForTest(),
				readPresetConfig({ mode: 'cool', label: 'Night' }),
				language
			);

			expect(description.label?.text).toBe('Night');
		}
	);
});
