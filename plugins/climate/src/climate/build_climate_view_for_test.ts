import type {
	SensorReading,
	UnitEnergy,
	UnitState,
} from '../daikin/unit_types';
import { buildUnitStateForTest } from './build_unit_state_for_test';
import type { ClimateView } from './climate_view';

/** A ready view of a unit that is on, cooling at 21 degrees, in a room at 23 degrees with 4 degrees outside; fields to override are given. */
export function buildClimateViewForTest(
	overrides: Readonly<{
		status?: ClimateView['status'];
		state?: Partial<UnitState> | null;
		sensors?: Partial<SensorReading> | null;
		energy?: UnitEnergy;
	}> = {}
): ClimateView {
	return {
		energy: overrides.energy,
		status: overrides.status ?? 'ready',
		state:
			overrides.state === null
				? undefined
				: buildUnitStateForTest({ isPowered: true, ...overrides.state }),
		sensors:
			overrides.sensors === null
				? undefined
				: {
						indoorTemperature: 23,
						outdoorTemperature: 4,
						indoorHumidity: null,
						compressorFrequency: 0,
						...overrides.sensors,
					},
	};
}
