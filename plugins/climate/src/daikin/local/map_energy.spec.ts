import { describe, expect, it } from 'vitest';

import { UnitProtocolError } from '../errors/unit_protocol_error';
import { mapEnergy } from './map_energy';

const MEASURED_HEAT = '0/0/1/0/5/11/14/22/3/0/0/0/0/0';
const MEASURED_COOL = '0/0/0/0/3/2/1/1/1/0/1/0/1/1';

describe('mapEnergy', () => {
	it('should sum the first seven days and read index 0 as today when the lists are well formed', () => {
		const energy = mapEnergy({
			week_heat: MEASURED_HEAT,
			week_cool: MEASURED_COOL,
		});

		expect(energy).toEqual({
			heat: { todayKilowattHours: 0, lastSevenDaysKilowattHours: 3.1 },
			cool: { todayKilowattHours: 0, lastSevenDaysKilowattHours: 0.6 },
		});
	});

	it('should convert tenths of kWh to kWh when today has a value', () => {
		const energy = mapEnergy({
			week_heat: '15/0/0/0/0/0/0/0/0/0/0/0/0/0',
			week_cool: '3/1/0/0/0/0/0/99/0/0/0/0/0/0',
		});

		expect(energy.heat.todayKilowattHours).toBe(1.5);
		expect(energy.cool).toEqual({
			todayKilowattHours: 0.3,
			lastSevenDaysKilowattHours: 0.4,
		});
	});

	it.each([
		['a list with too few values', '1/2/3'],
		['a list with too many values', '0/0/0/0/0/0/0/0/0/0/0/0/0/0/0'],
		['a value that is not a number', '0/0/x/0/0/0/0/0/0/0/0/0/0/0'],
		['a negative value', '0/0/-1/0/0/0/0/0/0/0/0/0/0/0'],
		['an empty list', ''],
	])(
		'should throw a protocol error when week_heat is %s',
		(_name, week_heat) => {
			expect(() => mapEnergy({ week_heat, week_cool: MEASURED_COOL })).toThrow(
				UnitProtocolError
			);
		}
	);

	it('should throw a protocol error when week_cool is missing', () => {
		expect(() => mapEnergy({ week_heat: MEASURED_HEAT })).toThrow(
			UnitProtocolError
		);
	});
});
