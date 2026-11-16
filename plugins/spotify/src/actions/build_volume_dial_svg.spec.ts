import { describe, expect, it } from 'vitest';

import { buildVolumeDialSvg } from './build_volume_dial_svg';
import type { VolumeReading } from './volume_reading';

const READING: VolumeReading = {
	caption: 'SPOTIFY',
	name: 'Spotify',
	volume: 0.5,
	isMuted: false,
};

describe('buildVolumeDialSvg', () => {
	it('should draw a 200x100 document', () => {
		expect(buildVolumeDialSvg(READING, 'en')).toMatch(
			/^<svg [^>]*width="200" height="100" viewBox="0 0 200 100">.*<\/svg>$/
		);
	});

	it('should show the caption, the name and the volume in percent', () => {
		const svg = buildVolumeDialSvg(READING, 'en');

		expect(svg).toContain('>SPOTIFY</text>');
		expect(svg).toContain('>Spotify</text>');
		expect(svg).toContain('>50%</text>');
	});

	it('should write the muted app in French', () => {
		const svg = buildVolumeDialSvg({ ...READING, isMuted: true }, 'fr');

		expect(svg).toContain('>Muet</text>');
		expect(svg).toContain('>Appuyer pour rétablir le son</text>');
	});

	it('should write an app that plays no sound in French', () => {
		const svg = buildVolumeDialSvg({ ...READING, volume: undefined }, 'fr');

		expect(svg).toContain('>Aucun son en cours</text>');
	});

	it('should fill the bar in proportion to the volume', () => {
		expect(buildVolumeDialSvg(READING, 'en')).toContain(
			'width="88" height="8" rx="4" fill="#1DB954"'
		);
	});

	it('should show a muted app', () => {
		const svg = buildVolumeDialSvg({ ...READING, isMuted: true }, 'en');

		expect(svg).toContain('>Muted</text>');
		expect(svg).toContain('fill="#727272"');
		expect(svg).toContain('>Press to unmute</text>');
	});

	it('should show an app that plays no sound', () => {
		const svg = buildVolumeDialSvg({ ...READING, volume: undefined }, 'en');

		expect(svg).toContain('>–</text>');
		expect(svg).toContain('>Not playing sound</text>');
		expect(svg).not.toContain('fill="#1DB954"');
	});

	it('should escape and truncate a long app name', () => {
		const svg = buildVolumeDialSvg(
			{
				...READING,
				name: '&Co Rocket League',
			},
			'en'
		);

		expect(svg).toContain('>&amp;Co Rocket L…</text>');
	});

	it('should draw the backdrop behind the volume', () => {
		const svg = buildVolumeDialSvg(READING, 'en', {
			coverDataUrl: 'data:image/jpeg;base64,AQID',
			column: 1,
		});

		expect(svg).toMatch(/<rect [^>]*\/><image x="-200" .*>Spotify<\/text>/);
	});

	it('should draw no image without backdrop', () => {
		expect(buildVolumeDialSvg(READING, 'en')).not.toContain('<image');
	});
});
