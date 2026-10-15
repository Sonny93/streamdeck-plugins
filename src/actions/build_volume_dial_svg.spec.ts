import { describe, expect, it } from 'vitest';

import type { VolumeReading } from './volume_reading';
import { buildVolumeDialSvg } from './build_volume_dial_svg';

const READING: VolumeReading = {
	caption: 'SPOTIFY',
	name: 'Spotify',
	volume: 0.5,
	isMuted: false,
};

describe('buildVolumeDialSvg', () => {
	it('should draw a 200x100 document', () => {
		expect(buildVolumeDialSvg(READING)).toMatch(
			/^<svg [^>]*width="200" height="100" viewBox="0 0 200 100">.*<\/svg>$/
		);
	});

	it('should show the caption, the name and the volume in percent', () => {
		const svg = buildVolumeDialSvg(READING);

		expect(svg).toContain('>SPOTIFY</text>');
		expect(svg).toContain('>Spotify</text>');
		expect(svg).toContain('>50%</text>');
	});

	it('should fill the bar in proportion to the volume', () => {
		expect(buildVolumeDialSvg(READING)).toContain(
			'width="88" height="8" rx="4" fill="#1DB954"'
		);
	});

	it('should show a muted app', () => {
		const svg = buildVolumeDialSvg({ ...READING, isMuted: true });

		expect(svg).toContain('>Muted</text>');
		expect(svg).toContain('fill="#727272"');
		expect(svg).toContain('>Press to unmute</text>');
	});

	it('should show an app that plays no sound', () => {
		const svg = buildVolumeDialSvg({ ...READING, volume: undefined });

		expect(svg).toContain('>–</text>');
		expect(svg).toContain('>Not playing sound</text>');
		expect(svg).not.toContain('fill="#1DB954"');
	});

	it('should escape and truncate a long app name', () => {
		const svg = buildVolumeDialSvg({
			...READING,
			name: '&Co Rocket League',
		});

		expect(svg).toContain('>&amp;Co Rocket L…</text>');
	});
});
