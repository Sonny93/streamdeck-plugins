import { describe, expect, it } from 'vitest';

import { UnitProtocolError } from '../errors/unit_protocol_error';
import { FAKE_UNIT_DEFAULTS } from '../fake/fake_unit_defaults';
import type { RawRecord } from '../raw_record';
import { mapCapabilities } from './map_capabilities';
import { mapFaultCode } from './map_fault_code';
import { mapSensorReading } from './map_sensor_reading';
import { mapUnitState } from './map_unit_state';

function buildControl(overrides: RawRecord = {}): RawRecord {
	return { ...FAKE_UNIT_DEFAULTS.controlInfo, ...overrides };
}

describe('mapUnitState', () => {
	it.each(['0', '1', '7'])('should map raw mode %s to auto', (mode) => {
		expect(mapUnitState(buildControl({ mode })).mode).toBe('auto');
	});

	it.each([
		['2', 'dry'],
		['3', 'cool'],
		['4', 'heat'],
		['6', 'fan'],
	])('should map raw mode %s to %s', (mode, expected) => {
		expect(mapUnitState(buildControl({ mode })).mode).toBe(expected);
	});

	it.each([
		['A', 'auto'],
		['B', 'silent'],
		['3', 1],
		['7', 5],
	])('should map raw f_rate %s to %s', (raw, expected) => {
		expect(mapUnitState(buildControl({ f_rate: raw })).fanRate).toBe(expected);
	});

	it.each([
		['0', 'fixed'],
		['1', 'vertical'],
		['2', 'horizontal'],
		['3', 'both'],
	])('should map raw f_dir %s to %s', (raw, expected) => {
		expect(mapUnitState(buildControl({ f_dir: raw })).fanDirection).toBe(
			expected
		);
	});

	it.each(['M', '--', '-'])('should map stemp %s to null', (stemp) => {
		expect(mapUnitState(buildControl({ stemp })).targetTemperature).toBeNull();
	});

	it('should map a numeric stemp and the power flag', () => {
		const state = mapUnitState(buildControl({ stemp: '22.5', pow: '1' }));

		expect(state).toMatchObject({ targetTemperature: 22.5, isPowered: true });
	});

	it.each([
		['', []],
		['2', ['powerful']],
		['12', ['econo']],
		['13', ['streamer']],
		['2/13', ['powerful', 'streamer']],
		['12/13', ['econo', 'streamer']],
		['2/99', ['powerful']],
		['99', []],
	])('should map adv %j to the special modes %j', (adv, expected) => {
		expect(mapUnitState(buildControl({ adv })).specialModes).toEqual(expected);
	});

	it('should map an absent adv key to no special mode', () => {
		const { adv: _adv, ...withoutAdv } = buildControl();

		expect(mapUnitState(withoutAdv).specialModes).toEqual([]);
	});

	it.each([
		['mode', '5'],
		['f_rate', 'Z'],
		['f_dir', '9'],
		['pow', '2'],
		['stemp', 'abc'],
	])(
		'should throw a protocol error when %s has the unknown value %s',
		(key, value) => {
			expect(() => mapUnitState(buildControl({ [key]: value }))).toThrow(
				UnitProtocolError
			);
		}
	);

	it('should throw a protocol error when an expected key is missing', () => {
		const { mode: _mode, ...withoutMode } = buildControl();

		expect(() => mapUnitState(withoutMode)).toThrow(UnitProtocolError);
	});
});

describe('mapSensorReading', () => {
	it('should map the fake unit sensors, with a missing humidity probe as null', () => {
		expect(mapSensorReading(FAKE_UNIT_DEFAULTS.sensorInfo)).toEqual({
			indoorTemperature: 23,
			outdoorTemperature: 4,
			indoorHumidity: null,
			compressorFrequency: 0,
		});
	});

	it('should throw a protocol error when htemp is not a number', () => {
		expect(() => mapSensorReading({ htemp: 'x', otemp: '4.0' })).toThrow(
			UnitProtocolError
		);
	});
});

describe('mapFaultCode', () => {
	it('should return null when err is 0', () => {
		expect(mapFaultCode({ err: '0' })).toBeNull();
	});

	it('should return the code when err is not 0', () => {
		expect(mapFaultCode({ err: 'A3' })).toBe('A3');
	});
});

describe('mapCapabilities', () => {
	it('should map the fake unit model info', () => {
		expect(mapCapabilities(FAKE_UNIT_DEFAULTS.modelInfo)).toEqual({
			isFanRateSettable: true,
			swing: 'both',
			hasHumiditySensor: false,
		});
	});

	it('should report no swing when en_fdir is 0', () => {
		const model = { ...FAKE_UNIT_DEFAULTS.modelInfo, en_fdir: '0' };

		expect(mapCapabilities(model).swing).toBe('none');
	});
});
