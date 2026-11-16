import { describe, expect, it } from 'vitest';

import { buildClimateViewForTest } from '../../climate/build_climate_view_for_test';
import { KeyState } from '../keys/key_state';
import { describeFanKey } from './describe_fan_key';

describe('describeFanKey', () => {
	it('should show the displayed fan rate and be lit when the unit is on', () => {
		const description = describeFanKey(
			buildClimateViewForTest({ state: { fanRate: 3 } }),
			{ control: 'rate' },
			'fr'
		);

		expect(description.state).toBe(KeyState.on);
		expect(description.label?.text).toBe('3');
	});

	it('should be off when the unit is off', () => {
		const description = describeFanKey(
			buildClimateViewForTest({
				state: { isPowered: false, fanRate: 'silent' },
			}),
			{ control: 'rate' },
			'fr'
		);

		expect(description.state).toBe(KeyState.off);
		expect(description.label?.text).toBe('Silence');
	});

	it.each([
		['both', KeyState.on],
		['vertical', KeyState.on],
		['fixed', KeyState.off],
	] as const)(
		'should be in state %s for the swing key when the unit swings %s',
		(fanDirection, expected) => {
			const description = describeFanKey(
				buildClimateViewForTest({ state: { fanDirection } }),
				{ control: 'swing' },
				'fr'
			);

			expect(description.state).toBe(expected);
			expect(description.label?.text).toBe('Balayage');
		}
	);

	it.each(['rate', 'swing'] as const)(
		'should be unavailable without label for the %s key when the unit is not ready',
		(control) => {
			const description = describeFanKey(
				buildClimateViewForTest({ status: 'loading' }),
				{ control },
				'fr'
			);

			expect(description.state).toBe(KeyState.unavailable);
			expect(description.label).toBeUndefined();
		}
	);
});

describe('describeFanKey in English', () => {
	it.each([
		['auto', 'Auto'],
		['silent', 'Silent'],
		[4, '4'],
	] as const)('should name the fan rate %s as %s', (fanRate, expected) => {
		const description = describeFanKey(
			buildClimateViewForTest({ state: { fanRate } }),
			{ control: 'rate' },
			'en'
		);

		expect(description.label?.text).toBe(expected);
	});

	it('should label the swing key Swing', () => {
		const description = describeFanKey(
			buildClimateViewForTest(),
			{ control: 'swing' },
			'en'
		);

		expect(description.label?.text).toBe('Swing');
	});
});
