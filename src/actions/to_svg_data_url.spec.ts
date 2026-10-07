import { describe, expect, it } from 'vitest';

import { toSvgDataUrl } from './to_svg_data_url';

function decode(dataUrl: string): string {
	return Buffer.from(dataUrl.split(',')[1] ?? '', 'base64').toString('utf8');
}

describe('toSvgDataUrl', () => {
	it('should encode the svg as a base64 data url', () => {
		expect(toSvgDataUrl('<svg/>')).toBe(
			`data:image/svg+xml;base64,${btoa('<svg/>')}`
		);
	});

	it('should encode non ASCII characters as UTF-8', () => {
		expect(decode(toSvgDataUrl('é…'))).toBe('é…');
	});
});
