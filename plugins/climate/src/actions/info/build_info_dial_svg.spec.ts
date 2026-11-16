import { describe, expect, it } from 'vitest';

import { buildClimateViewForTest } from '../../climate/build_climate_view_for_test';
import { buildInfoDialSvg } from './build_info_dial_svg';

describe('buildInfoDialSvg', () => {
	it('should draw the outdoor temperature large under its label', () => {
		const svg = buildInfoDialSvg(
			buildClimateViewForTest({ sensors: { outdoorTemperature: 4.5 } })
		);

		expect(svg).toContain('>Extérieur<');
		expect(svg).toContain('font-size="40" font-weight="bold">4,5 °C<');
	});

	it('should say the compressor is on when its frequency is above zero', () => {
		const svg = buildInfoDialSvg(
			buildClimateViewForTest({ sensors: { compressorFrequency: 35 } })
		);

		expect(svg).toContain('>Compresseur actif<');
	});

	it('should say the compressor is idle when its frequency is zero', () => {
		const svg = buildInfoDialSvg(
			buildClimateViewForTest({ sensors: { compressorFrequency: 0 } })
		);

		expect(svg).toContain('>Compresseur à l&apos;arrêt<');
	});

	it('should say nothing about the compressor when its frequency is unknown', () => {
		const svg = buildInfoDialSvg(
			buildClimateViewForTest({ sensors: { compressorFrequency: null } })
		);

		expect(svg).not.toContain('Compresseur');
	});

	it('should list the active special modes when there are some', () => {
		const svg = buildInfoDialSvg(
			buildClimateViewForTest({
				state: { specialModes: ['powerful', 'streamer'] },
			})
		);

		expect(svg).toContain('>Puissant, Streamer<');
	});

	it('should list no special mode when none is active', () => {
		const svg = buildInfoDialSvg(buildClimateViewForTest());

		expect(svg).not.toMatch(/Puissant|Éco|Streamer/u);
	});

	it('should draw a dash when the outdoor temperature is unknown', () => {
		const svg = buildInfoDialSvg(
			buildClimateViewForTest({ sensors: { outdoorTemperature: null } })
		);

		expect(svg).toContain('>–<');
	});

	it.each([
		['unconfigured', 'Adresse à définir'],
		['loading', 'Chargement...'],
		['unreachable', 'Injoignable'],
	] as const)(
		'should draw a message when the status is %s',
		(status, message) => {
			const svg = buildInfoDialSvg(buildClimateViewForTest({ status }));

			expect(svg).toContain(`>${message}<`);
			expect(svg).not.toContain('Extérieur');
		}
	);
});
