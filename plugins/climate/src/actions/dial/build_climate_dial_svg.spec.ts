import { describe, expect, it } from 'vitest';

import { buildClimateViewForTest } from '../../climate/build_climate_view_for_test';
import { StripPalette } from '../strip/strip_palette';
import { StripTones } from '../strip/strip_tones';
import { buildClimateDialSvg } from './build_climate_dial_svg';

describe('buildClimateDialSvg', () => {
	it('should draw the room, target and outdoor temperatures and the mode when the unit is on', () => {
		const svg = buildClimateDialSvg(
			buildClimateViewForTest({
				state: { mode: 'heat', targetTemperature: 22.5 },
			})
		);

		expect(svg).toContain('>23°<');
		expect(svg).toContain('>22,5°<');
		expect(svg).toContain('>Ext. 4 °C<');
		expect(svg).toContain('>CHAUD<');
		expect(svg).toContain('>CONSIGNE<');
		expect(svg).toContain('<g opacity="1">');
	});

	it('should draw the background of the mode of the unit', () => {
		const svg = buildClimateDialSvg(
			buildClimateViewForTest({ state: { mode: 'heat' } })
		);

		expect(svg).toContain(StripTones.heat.from);
	});

	it('should dim the picture over the neutral background when the unit is off', () => {
		const svg = buildClimateDialSvg(
			buildClimateViewForTest({ state: { isPowered: false } })
		);

		expect(svg).toContain('<g opacity="0.7">');
		expect(svg).toContain(StripTones.neutral.from);
	});

	it('should draw a dash for the target when the unit has none', () => {
		const svg = buildClimateDialSvg(
			buildClimateViewForTest({
				state: { mode: 'dry', targetTemperature: null },
			})
		);

		expect(svg).toContain('>–<');
		expect(svg).toContain('>DÉSHU.<');
	});

	it('should draw dashes for the sensors when they are unknown', () => {
		expect(
			buildClimateDialSvg(buildClimateViewForTest({ sensors: null }))
		).toContain('>Ext. –<');
	});

	it('should show the draft in the accent color under "À VALIDER" and keep the current target small when a draft exists', () => {
		const svg = buildClimateDialSvg(buildClimateViewForTest(), 23.5);

		expect(svg).toContain(
			`fill="${StripPalette.accent}" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="bold" text-anchor="end">23,5°<`
		);
		expect(svg).toContain('>À VALIDER<');
		expect(svg).toContain('>Actuel 21°<');
		expect(svg).not.toContain('>CONSIGNE<');
	});

	it('should not show the draft caption when there is no draft', () => {
		const svg = buildClimateDialSvg(buildClimateViewForTest());

		expect(svg).not.toContain('À VALIDER');
		expect(svg).not.toContain('Actuel ');
	});

	it.each([
		['unconfigured', 'Adresse à définir'],
		['loading', 'Chargement...'],
		['unreachable', 'Injoignable'],
	] as const)(
		'should draw a message instead of the temperatures when the status is %s',
		(status, message) => {
			const svg = buildClimateDialSvg(buildClimateViewForTest({ status }), 25);

			expect(svg).toContain(`>${message}<`);
			expect(svg).not.toContain('PIÈCE');
		}
	);

	it('should be a 200 by 100 picture the size of the strip layout', () => {
		expect(buildClimateDialSvg(buildClimateViewForTest())).toContain(
			'width="200" height="100"'
		);
	});
});
