import { describe, expect, it } from 'vitest';

import { buildClimateViewForTest } from '../../climate/build_climate_view_for_test';
import { buildDashboardSvg } from '../../idle/build_dashboard_svg';
import { buildClimateDialSvg } from '../dial/build_climate_dial_svg';
import { buildEnergyDialSvg } from '../energy/build_energy_dial_svg';
import { buildFanDialSvg } from '../fan_dial/build_fan_dial_svg';
import { buildInfoDialSvg } from '../info/build_info_dial_svg';

const ENERGY = {
	heat: { todayKilowattHours: 0.5, lastSevenDaysKilowattHours: 3.1 },
	cool: { todayKilowattHours: 0.7, lastSevenDaysKilowattHours: 0.6 },
};

describe('the strips in English', () => {
	it('should draw the Climate strip with English captions and a decimal point', () => {
		const svg = buildClimateDialSvg(
			buildClimateViewForTest({
				state: { mode: 'heat', targetTemperature: 22.5 },
			}),
			'en'
		);

		expect(svg).toContain('>HEAT<');
		expect(svg).toContain('>ROOM<');
		expect(svg).toContain('>TARGET<');
		expect(svg).toContain('>22.5°<');
		expect(svg).toContain('>Out 4 °C<');
	});

	it('should draw the draft captions of the Climate strip in English', () => {
		const svg = buildClimateDialSvg(buildClimateViewForTest(), 'en', 23.5);

		expect(svg).toContain('>PUSH TO SET<');
		expect(svg).toContain('>Current 21°<');
		expect(svg).toContain('>23.5°<');
	});

	it.each([
		['unconfigured', 'Set the address'],
		['loading', 'Loading...'],
		['unreachable', 'Unreachable'],
	] as const)('should draw the %s message in English', (status, message) => {
		expect(
			buildClimateDialSvg(buildClimateViewForTest({ status }), 'en')
		).toContain(`>${message}<`);
	});

	it('should draw the Info strip in English', () => {
		const svg = buildInfoDialSvg(
			buildClimateViewForTest({
				state: { specialModes: ['powerful', 'econo'] },
				sensors: { compressorFrequency: 20 },
			}),
			'en'
		);

		expect(svg).toContain('>Outdoor<');
		expect(svg).toContain('>Compressor on<');
		expect(svg).toContain('>Powerful, Econo<');
	});

	it('should say the compressor is idle in English', () => {
		const svg = buildInfoDialSvg(
			buildClimateViewForTest({ sensors: { compressorFrequency: 0 } }),
			'en'
		);

		expect(svg).toContain('>Compressor idle<');
	});

	it('should draw the Energy strip in English with decimal points', () => {
		const svg = buildEnergyDialSvg(
			buildClimateViewForTest({ energy: ENERGY }),
			'en'
		);

		expect(svg).toContain('>Today<');
		expect(svg).toContain('>7 days<');
		expect(svg).toContain('>heat 0.5<');
		expect(svg).toContain('>cool 0.7<');
		expect(svg).toContain('>1.2<');
	});

	it.each([
		['fixed', 'Fixed'],
		['both', 'Swing'],
	] as const)(
		'should name the louver %s as %s on the Fan strip in English',
		(fanDirection, expected) => {
			const svg = buildFanDialSvg(
				buildClimateViewForTest({ state: { fanRate: 'silent', fanDirection } }),
				'en'
			);

			expect(svg).toContain('>FAN<');
			expect(svg).toContain('>Silent<');
			expect(svg).toContain(`>${expected}<`);
		}
	);

	it('should draw the dashboard in English', () => {
		const svg = buildDashboardSvg(
			buildClimateViewForTest({
				state: { mode: 'heat', targetTemperature: 21.5, fanRate: 'silent' },
				energy: ENERGY,
			}),
			'en',
			3
		);

		expect(svg).toContain('>Fan Silent<');
		expect(svg).toContain('>Today 1.2 kWh<');
	});

	it.each([
		[1, 'Heat 21.5°'],
		[2, 'OUTDOOR'],
		[0, 'ROOM'],
	])(
		'should draw the text of slot %s of the dashboard in English',
		(column, expected) => {
			const svg = buildDashboardSvg(
				buildClimateViewForTest({
					state: { mode: 'heat', targetTemperature: 21.5 },
				}),
				'en',
				column
			);

			expect(svg).toContain(`>${expected}<`);
		}
	);

	it('should say the unit is off in English on the dashboard', () => {
		const svg = buildDashboardSvg(
			buildClimateViewForTest({ state: { isPowered: false } }),
			'en',
			1
		);

		expect(svg).toContain('>Off<');
	});

	it('should draw a dash for unknown energy in English on the dashboard', () => {
		expect(buildDashboardSvg(buildClimateViewForTest(), 'en', 3)).toContain(
			'>Today –<'
		);
	});
});
