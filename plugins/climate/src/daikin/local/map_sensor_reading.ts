import { parseNullableNumber } from '../protocol/parse_nullable_number';
import { requireValue } from '../protocol/require_value';
import type { RawRecord } from '../raw_record';
import type { SensorReading } from '../unit_types';

function readOptionalNumber(sensors: RawRecord, key: string): number | null {
	const raw = sensors[key];
	return raw === undefined ? null : parseNullableNumber(key, raw);
}

/** Maps raw `get_sensor_info`. `htemp` and `otemp` must be present, the others may be absent. */
export function mapSensorReading(sensors: RawRecord): SensorReading {
	return {
		indoorTemperature: parseNullableNumber(
			'htemp',
			requireValue(sensors, 'htemp')
		),
		outdoorTemperature: parseNullableNumber(
			'otemp',
			requireValue(sensors, 'otemp')
		),
		indoorHumidity: readOptionalNumber(sensors, 'hhum'),
		compressorFrequency: readOptionalNumber(sensors, 'cmpfreq'),
	};
}
