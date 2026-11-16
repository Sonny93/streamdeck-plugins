import { UnitProtocolError } from '../errors/unit_protocol_error';
import { requireValue } from '../protocol/require_value';
import type { RawRecord } from '../raw_record';
import type { EnergyConsumption, UnitEnergy } from '../unit_types';

const DAYS_IN_LIST = 14;
const DAYS_IN_WEEK = 7;
const LIST_SEPARATOR = '/';
const TENTHS_PER_KILOWATT_HOUR = 10;
const WATT_HOUR_TENTH_PATTERN = /^\d+$/u;

function parseDailyTenths(key: string, raw: string): readonly number[] {
	const parts = raw.split(LIST_SEPARATOR);
	if (
		parts.length !== DAYS_IN_LIST ||
		!parts.every((part) => WATT_HOUR_TENTH_PATTERN.test(part))
	) {
		throw new UnitProtocolError(
			`Expected ${DAYS_IN_LIST} whole numbers in "${key}", got "${raw}"`
		);
	}
	return parts.map(Number);
}

function toConsumption(tenths: readonly number[]): EnergyConsumption {
	const lastSevenDays = tenths
		.slice(0, DAYS_IN_WEEK)
		.reduce((total, value) => total + value, 0);
	return {
		todayKilowattHours: (tenths[0] ?? 0) / TENTHS_PER_KILOWATT_HOUR,
		lastSevenDaysKilowattHours: lastSevenDays / TENTHS_PER_KILOWATT_HOUR,
	};
}

/**
 * Maps raw `get_week_power_ex`: `week_heat` and `week_cool` hold 14 daily values in units of 0.1 kWh,
 * index 0 being today and index N being N days ago. Anything else is a protocol error.
 */
export function mapEnergy(record: RawRecord): UnitEnergy {
	return {
		heat: toConsumption(
			parseDailyTenths('week_heat', requireValue(record, 'week_heat'))
		),
		cool: toConsumption(
			parseDailyTenths('week_cool', requireValue(record, 'week_cool'))
		),
	};
}
