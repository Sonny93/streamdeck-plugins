import { describe, expect, it } from 'vitest';

import { InvalidCommandError } from '../errors/invalid_command_error';
import { FAKE_UNIT_DEFAULTS } from '../fake/fake_unit_defaults';
import type { RawRecord } from '../raw_record';
import { buildSetParams } from './build_set_params';

function buildControl(overrides: RawRecord = {}): RawRecord {
	return { ...FAKE_UNIT_DEFAULTS.controlInfo, ...overrides };
}

describe('buildSetParams', () => {
	it('should use the values memorized for the target mode when the mode changes', () => {
		const params = buildSetParams(buildControl(), { mode: 'heat' });

		expect(params).toEqual({
			pow: '0',
			mode: '4',
			stemp: '25.0',
			shum: '0',
			f_rate: 'A',
			f_dir: '0',
		});
	});

	it('should send absent markers for temperature and humidity when switching to fan without dt6 and dh6', () => {
		const params = buildSetParams(buildControl(), { mode: 'fan' });

		expect(params).toMatchObject({ mode: '6', stemp: '--', shum: '--' });
	});

	it('should write auto as raw mode 1 with its memorized AUTO humidity when the mode changes', () => {
		const params = buildSetParams(buildControl(), { mode: 'auto' });

		expect(params).toMatchObject({ mode: '1', stemp: '25.0', shum: 'AUTO' });
	});

	it('should keep the current fan rate and direction when the target mode has none memorized', () => {
		const {
			dfr4: _rate,
			dfd4: _direction,
			...memorized
		} = buildControl({ f_rate: 'B', f_dir: '2' });

		const params = buildSetParams(memorized, { mode: 'heat' });

		expect(params).toMatchObject({ mode: '4', f_rate: 'B', f_dir: '2' });
	});

	it('should let explicit values win over memorized ones when the mode changes', () => {
		const params = buildSetParams(buildControl(), {
			mode: 'heat',
			targetTemperature: 19,
			fanRate: 3,
			fanDirection: 'both',
		});

		expect(params).toMatchObject({
			mode: '4',
			stemp: '19.0',
			f_rate: '5',
			f_dir: '3',
		});
	});

	it('should keep the raw auto code, stemp M and shum AUTO when the mode is unchanged', () => {
		const control = buildControl({ mode: '7', stemp: 'M', shum: 'AUTO' });

		expect(buildSetParams(control, { isPowered: true })).toEqual({
			pow: '1',
			mode: '7',
			stemp: 'M',
			shum: 'AUTO',
			f_rate: 'A',
			f_dir: '0',
		});
	});

	it('should keep raw mode 0 when auto is requested while already in auto', () => {
		const control = buildControl({ mode: '0' });

		expect(buildSetParams(control, { mode: 'auto' }).mode).toBe('0');
	});

	it('should override the current temperature and format it with one decimal when the mode is unchanged', () => {
		const integer = buildSetParams(buildControl(), { targetTemperature: 22 });
		const half = buildSetParams(buildControl(), { targetTemperature: 22.5 });

		expect([integer.stemp, half.stemp]).toEqual(['22.0', '22.5']);
	});

	it.each([Number.NaN, Number.POSITIVE_INFINITY, 21.3, 21.25])(
		'should refuse the target temperature %s when it is not a finite multiple of 0.5',
		(targetTemperature) => {
			expect(() =>
				buildSetParams(buildControl(), { targetTemperature })
			).toThrow(InvalidCommandError);
		}
	);

	it.each([
		['cool', 18, true],
		['cool', 32, true],
		['cool', 17.5, false],
		['cool', 32.5, false],
		['heat', 10, true],
		['heat', 30, true],
		['heat', 9.5, false],
		['heat', 30.5, false],
		['auto', 18, true],
		['auto', 30, true],
		['auto', 17.5, false],
		['auto', 30.5, false],
	] as const)(
		'should check the %s mode target temperature %d (accepted: %s)',
		(mode, targetTemperature, isAccepted) => {
			const build = () =>
				buildSetParams(buildControl(), { mode, targetTemperature });

			if (isAccepted) expect(build).not.toThrow();
			else expect(build).toThrow(InvalidCommandError);
		}
	);

	it('should check the range of the current mode when no mode is given', () => {
		const control = buildControl({ mode: '4' });

		expect(() => buildSetParams(control, { targetTemperature: 31 })).toThrow(
			InvalidCommandError
		);
		expect(buildSetParams(control, { targetTemperature: 12 }).stemp).toBe(
			'12.0'
		);
	});

	it.each(['dry', 'fan'] as const)(
		'should refuse a target temperature when the requested mode is %s',
		(mode) => {
			expect(() =>
				buildSetParams(buildControl(), { mode, targetTemperature: 21 })
			).toThrow(InvalidCommandError);
		}
	);

	it('should refuse a target temperature when the unit is already in dry mode and no mode is given', () => {
		const control = buildControl({ mode: '2', stemp: 'M' });

		expect(() => buildSetParams(control, { targetTemperature: 21 })).toThrow(
			InvalidCommandError
		);
	});
});
