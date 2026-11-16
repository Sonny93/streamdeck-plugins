import { describe, expect, it } from 'vitest';

import { buildClimateViewForTest } from '../../climate/build_climate_view_for_test';
import { KeyState } from '../keys/key_state';
import { describePowerKey } from './describe_power_key';

describe('describePowerKey', () => {
	it('should be lit and show the room temperature when the unit is on', () => {
		const description = describePowerKey(buildClimateViewForTest());

		expect(description.state).toBe(KeyState.on);
		expect(description.label).toEqual({ text: '23 °C', position: 'top' });
	});

	it('should be off and still show the room temperature when the unit is off', () => {
		const description = describePowerKey(
			buildClimateViewForTest({ state: { isPowered: false } })
		);

		expect(description.state).toBe(KeyState.off);
		expect(description.label?.text).toBe('23 °C');
	});

	it('should show a dash when the room temperature is unknown', () => {
		const description = describePowerKey(
			buildClimateViewForTest({ sensors: { indoorTemperature: null } })
		);

		expect(description.label?.text).toBe('–');
	});

	it.each(['unconfigured', 'loading', 'unreachable'] as const)(
		'should be unavailable without label when the status is %s',
		(status) => {
			const description = describePowerKey(buildClimateViewForTest({ status }));

			expect(description.state).toBe(KeyState.unavailable);
			expect(description.label).toBeUndefined();
		}
	);
});
