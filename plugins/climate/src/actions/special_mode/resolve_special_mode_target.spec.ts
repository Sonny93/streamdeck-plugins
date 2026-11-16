import { describe, expect, it } from 'vitest';

import { buildUnitStateForTest } from '../../climate/build_unit_state_for_test';
import { resolveSpecialModeTarget } from './resolve_special_mode_target';

describe('resolveSpecialModeTarget', () => {
	it('should turn the mode on when the unit is on and the mode is not active', () => {
		const state = buildUnitStateForTest({ isPowered: true, specialModes: [] });

		expect(resolveSpecialModeTarget(state, 'powerful')).toBe(true);
	});

	it('should turn the mode off when it is active', () => {
		const state = buildUnitStateForTest({
			isPowered: true,
			specialModes: ['econo'],
		});

		expect(resolveSpecialModeTarget(state, 'econo')).toBe(false);
	});

	it('should turn the mode on when only the other special mode is active', () => {
		const state = buildUnitStateForTest({
			isPowered: true,
			specialModes: ['econo'],
		});

		expect(resolveSpecialModeTarget(state, 'powerful')).toBe(true);
	});

	it('should answer nothing when the unit is off', () => {
		const state = buildUnitStateForTest({ isPowered: false });

		expect(resolveSpecialModeTarget(state, 'powerful')).toBeUndefined();
	});
});
