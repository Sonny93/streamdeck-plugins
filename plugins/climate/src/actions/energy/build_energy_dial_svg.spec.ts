import { describe, expect, it } from 'vitest';

import { buildClimateViewForTest } from '../../climate/build_climate_view_for_test';
import { buildEnergyDialSvg } from './build_energy_dial_svg';

const ENERGY = {
	heat: { todayKilowattHours: 0.5, lastSevenDaysKilowattHours: 3.1 },
	cool: { todayKilowattHours: 0.25, lastSevenDaysKilowattHours: 0.6 },
};

describe('buildEnergyDialSvg', () => {
	it('should draw the total of today and of the last 7 days when the energy is known', () => {
		const svg = buildEnergyDialSvg(buildClimateViewForTest({ energy: ENERGY }));

		expect(svg).toContain('>0,8<');
		expect(svg).toContain('>3,7<');
		expect(svg).toContain('>Aujourd&apos;hui<');
		expect(svg).toContain('>7 jours<');
	});

	it('should draw the heat and cool split of each period', () => {
		const svg = buildEnergyDialSvg(buildClimateViewForTest({ energy: ENERGY }));

		expect(svg).toContain('>chaud 0,5<');
		expect(svg).toContain('>froid 0,3<');
		expect(svg).toContain('>chaud 3,1<');
		expect(svg).toContain('>froid 0,6<');
	});

	it('should draw dashes while there is no energy value', () => {
		const svg = buildEnergyDialSvg(buildClimateViewForTest());

		expect(svg).toContain('>chaud –<');
		expect(svg).toContain('>froid –<');
		expect(svg).toContain('font-size="32" font-weight="bold">–<');
	});

	it.each([
		['unconfigured', 'Adresse à définir'],
		['loading', 'Chargement...'],
		['unreachable', 'Injoignable'],
	] as const)(
		'should draw a message when the status is %s',
		(status, message) => {
			const svg = buildEnergyDialSvg(
				buildClimateViewForTest({ status, energy: ENERGY })
			);

			expect(svg).toContain(`>${message}<`);
			expect(svg).not.toContain('Aujourd');
		}
	);
});
