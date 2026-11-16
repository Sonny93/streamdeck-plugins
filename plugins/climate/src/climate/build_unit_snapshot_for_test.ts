import type {
	SensorReading,
	UnitSnapshot,
	UnitState,
} from '../daikin/unit_types';
import { buildUnitStateForTest } from './build_unit_state_for_test';

/** A snapshot with a room at 23 degrees and 4 degrees outside; the state and the sensors to override are given. */
export function buildUnitSnapshotForTest(
	overrides: Readonly<{
		state?: Partial<UnitState>;
		sensors?: Partial<SensorReading>;
	}> = {}
): UnitSnapshot {
	return {
		state: buildUnitStateForTest(overrides.state),
		sensors: {
			indoorTemperature: 23,
			outdoorTemperature: 4,
			indoorHumidity: null,
			compressorFrequency: 0,
			...overrides.sensors,
		},
		faultCode: null,
		readAt: new Date(0),
		raw: {},
	};
}
