import type { UnitState } from '../daikin/unit_types';

/** A unit state in cooling at 21 degrees, off, with the fan on auto; fields to override are given. */
export function buildUnitStateForTest(
	overrides: Readonly<Partial<UnitState>> = {}
): UnitState {
	return {
		isPowered: false,
		mode: 'cool',
		targetTemperature: 21,
		fanRate: 'auto',
		fanDirection: 'fixed',
		specialModes: [],
		...overrides,
	};
}
