import { describe, expect, it } from 'vitest';

import { buildClimateViewForTest } from '../../climate/build_climate_view_for_test';
import { KeyState } from '../keys/key_state';
import { describeSpecialModeKey } from './describe_special_mode_key';
import { readSpecialModeConfig } from './read_special_mode_config';

const POWERFUL = readSpecialModeConfig({ mode: 'powerful' });

describe('describeSpecialModeKey', () => {
	it('should be lit and show its label when the unit is on with the mode active', () => {
		const description = describeSpecialModeKey(
			buildClimateViewForTest({ state: { specialModes: ['powerful'] } }),
			POWERFUL
		);

		expect(description.state).toBe(KeyState.on);
		expect(description.label?.text).toBe('Puissant');
	});

	it('should be off when the unit is on and the mode is not active', () => {
		const description = describeSpecialModeKey(
			buildClimateViewForTest({ state: { specialModes: ['econo'] } }),
			POWERFUL
		);

		expect(description.state).toBe(KeyState.off);
	});

	it('should be off when the unit is off', () => {
		const description = describeSpecialModeKey(
			buildClimateViewForTest({
				state: { isPowered: false, specialModes: ['powerful'] },
			}),
			POWERFUL
		);

		expect(description.state).toBe(KeyState.off);
	});

	it.each(['unconfigured', 'loading', 'unreachable'] as const)(
		'should be unavailable without label when the status is %s',
		(status) => {
			const description = describeSpecialModeKey(
				buildClimateViewForTest({ status }),
				POWERFUL
			);

			expect(description.state).toBe(KeyState.unavailable);
			expect(description.label).toBeUndefined();
		}
	);
});
