import { describe, expect, it } from 'vitest';

import { buildClimateViewForTest } from '../../climate/build_climate_view_for_test';
import { StripTones } from '../strip/strip_tones';
import { buildFanDialSvg } from './build_fan_dial_svg';

describe('buildFanDialSvg', () => {
	it.each([
		['auto', 'Auto'],
		['silent', 'Silence'],
		[3, '3'],
	] as const)(
		'should draw the fan rate %s as %s under its caption',
		(fanRate, text) => {
			const svg = buildFanDialSvg(
				buildClimateViewForTest({ state: { fanRate } }),
				'fr'
			);

			expect(svg).toContain(`font-size="40" font-weight="bold">${text}<`);
			expect(svg).toContain('>VENTILATION<');
		}
	);

	it('should say the louver is fixed when the unit does not swing', () => {
		expect(buildFanDialSvg(buildClimateViewForTest(), 'fr')).toContain(
			'>Volet fixe<'
		);
	});

	it.each(['both', 'vertical', 'horizontal'] as const)(
		'should say the louver swings when the direction is %s',
		(fanDirection) => {
			const svg = buildFanDialSvg(
				buildClimateViewForTest({ state: { fanDirection } }),
				'fr'
			);

			expect(svg).toContain('>Balayage<');
		}
	);

	it('should dim the picture over the neutral background when the unit is off', () => {
		const svg = buildFanDialSvg(
			buildClimateViewForTest({ state: { isPowered: false } }),
			'fr'
		);

		expect(svg).toContain('<g opacity="0.7">');
		expect(svg).toContain(StripTones.neutral.from);
	});

	it.each([
		['unconfigured', 'Adresse à définir'],
		['loading', 'Chargement...'],
		['unreachable', 'Injoignable'],
	] as const)(
		'should draw a message when the status is %s',
		(status, message) => {
			const svg = buildFanDialSvg(buildClimateViewForTest({ status }), 'fr');

			expect(svg).toContain(`>${message}<`);
			expect(svg).not.toContain('VENTILATION');
		}
	);
});
