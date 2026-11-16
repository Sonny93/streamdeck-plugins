import type { UnitSnapshot } from '../unit_types';
import { mapFaultCode } from './map_fault_code';
import { mapSensorReading } from './map_sensor_reading';
import { mapUnitState } from './map_unit_state';
import { UNIT_PATHS } from './unit_paths';
import type { UnitRequester } from './unit_requester';

/** Two sequential GETs; the caller holds the host lock. */
export async function readSnapshot(
	request: UnitRequester
): Promise<UnitSnapshot> {
	const control = await request(UNIT_PATHS.controlInfo);
	const sensors = await request(UNIT_PATHS.sensorInfo);
	return {
		state: mapUnitState(control),
		sensors: mapSensorReading(sensors),
		faultCode: mapFaultCode(sensors),
		readAt: new Date(),
		raw: { get_control_info: control, get_sensor_info: sensors },
	};
}
