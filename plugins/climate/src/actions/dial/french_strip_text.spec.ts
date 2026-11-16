import { toSvgDataUrl } from 'deck-kit/text/to_svg_data_url';
import { describe, expect, it } from 'vitest';

import { buildClimateViewForTest } from '../../climate/build_climate_view_for_test';
import { buildClimateDialSvg } from './build_climate_dial_svg';

const DATA_URL_PREFIX = 'data:image/svg+xml;base64,';

function decodeDataUrl(dataUrl: string): string {
	return Buffer.from(dataUrl.slice(DATA_URL_PREFIX.length), 'base64').toString(
		'utf8'
	);
}

describe('the French texts of the Climate strip', () => {
	it('should keep the accented characters through the data URL the dial sends', () => {
		const view = buildClimateViewForTest({
			state: { mode: 'dry', targetTemperature: null },
		});

		const decoded = decodeDataUrl(
			toSvgDataUrl(buildClimateDialSvg(view, undefined, 1))
		);

		expect(decoded).toContain('>PIÈCE<');
		expect(decoded).toContain('>DÉSHU.<');
		expect(decoded).toContain('>CONSIGNE<');
	});

	it('should keep the accented draft caption through the data URL', () => {
		const decoded = decodeDataUrl(
			toSvgDataUrl(buildClimateDialSvg(buildClimateViewForTest(), 22.5))
		);

		expect(decoded).toContain('>À VALIDER<');
	});

	it('should escape the apostrophe of a French text so the picture stays valid XML', () => {
		expect(
			buildClimateDialSvg(buildClimateViewForTest({ status: 'unconfigured' }))
		).not.toContain("l'");
	});
});
