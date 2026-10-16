import { describe, expect, it } from 'vitest';

import type { NowPlayingFrame } from './now_playing_frame';
import { buildNowPlayingSvg } from './build_now_playing_svg';

const COVER = 'data:image/jpeg;base64,AQID';
const FRAME: NowPlayingFrame = {
	title: 'Kosandra',
	artistNames: ['Miyagi & Andy Panda'],
	coverDataUrl: COVER,
	lyrics: undefined,
	lyricsTransition: undefined,
	positionMilliseconds: 83_000,
	durationMilliseconds: 219_000,
	isPaused: false,
};

function build(frame: NowPlayingFrame, sliceLeft = 0): string {
	return buildNowPlayingSvg({ frame, sliceLeft });
}

function countImages(svg: string): number {
	return svg.split('<image ').length - 1;
}

describe('buildNowPlayingSvg', () => {
	it('should draw a 200x100 slice of the strip', () => {
		expect(build(FRAME)).toMatch(
			/^<svg [^>]*width="200" height="100" viewBox="0 0 200 100">.*<\/svg>$/
		);
	});

	it('should shift the view box to the slice of the dial', () => {
		expect(build(FRAME, 400)).toContain('viewBox="400 0 200 100"');
	});

	it('should draw the cover twice in the first slice, as the backdrop and as the cover', () => {
		expect(countImages(build(FRAME))).toBe(2);
	});

	it('should only draw the backdrop in the slices the cover does not overlap', () => {
		expect(countImages(build(FRAME, 200))).toBe(1);
	});

	it('should draw no image without cover', () => {
		expect(countImages(build({ ...FRAME, coverDataUrl: undefined }))).toBe(0);
	});

	it('should show the title and the escaped artists', () => {
		const svg = build(FRAME);

		expect(svg).toContain('>Kosandra</text>');
		expect(svg).toContain('>Miyagi &amp; Andy Panda</text>');
	});

	it('should join several artists', () => {
		expect(build({ ...FRAME, artistNames: ['A', 'B'] })).toContain(
			'>A, B</text>'
		);
	});

	it('should truncate a very long title', () => {
		const svg = build({ ...FRAME, title: 'A'.repeat(50) });

		expect(svg).toContain(`>${'A'.repeat(43)}…</text>`);
	});

	it('should show the elapsed time before the progress bar and the duration after it', () => {
		const svg = build(FRAME);

		expect(svg).toMatch(
			/<text x="152" [^>]*text-anchor="end"[^>]*>1:23<\/text>/
		);
		expect(svg).toMatch(
			/<text x="744" [^>]*text-anchor="start"[^>]*>3:39<\/text>/
		);
	});

	it('should show only the elapsed time when the duration is unknown', () => {
		const svg = build({ ...FRAME, durationMilliseconds: 0 });

		expect(svg).toContain('>1:23</text>');
		expect(svg).not.toContain('>3:39</text>');
	});

	it('should fill the progress bar in proportion to the position', () => {
		const svg = build({ ...FRAME, positionMilliseconds: 109_500 });

		expect(svg).toContain('width="288" height="6" rx="3" fill="#1DB954"');
	});

	it('should draw the pause badge and grey out the progress while paused', () => {
		const svg = build({ ...FRAME, isPaused: true });

		expect(svg).toContain('<circle');
		expect(svg).toContain('rx="3" fill="#B3B3B3"');
	});

	it('should not draw the pause badge while playing', () => {
		expect(build(FRAME)).not.toContain('<circle');
	});

	it('should keep the title and artists on the whole strip without lyrics', () => {
		const svg = build(FRAME);

		expect(svg).not.toContain('clip-path="url(#now-playing-info)"');
		expect(svg).toContain('font-size="26"');
	});

	it('should show the line being sung and the next one centered on the right half', () => {
		const svg = build(
			{ ...FRAME, lyrics: { current: 'Hola', next: 'Adiós' } },
			600
		);

		expect(svg).toMatch(
			/<text x="600" [^>]*text-anchor="middle"[^>]*>Hola<\/text>/
		);
		expect(svg).toMatch(
			/<text x="600" [^>]*text-anchor="middle"[^>]*>Adiós<\/text>/
		);
		expect(svg).toContain('clip-path="url(#now-playing-lyrics)"');
	});

	it('should keep every clip path inside defs, since the Stream Deck draws a bare one as a black shape', () => {
		const svg = build({ ...FRAME, lyrics: { current: 'Hola', next: 'Adiós' } });

		expect(svg.split('<clipPath').length - 1).toBe(3);
		expect(svg.split('<defs><clipPath').length - 1).toBe(3);
	});

	it('should put a long line being sung on two rows', () => {
		const svg = build({
			...FRAME,
			lyrics: {
				current: 'Once de la noche en San Salvador, El Salvador',
				next: undefined,
			},
		});

		expect(svg).toContain('>Once de la noche en San Salvador, El</text>');
		expect(svg).toContain('>Salvador</text>');
	});

	it('should keep the title and artists on the left half with lyrics', () => {
		const svg = build({
			...FRAME,
			title: 'A'.repeat(30),
			lyrics: { current: 'Hola', next: undefined },
		});

		expect(svg).toContain(`>${'A'.repeat(21)}…</text>`);
		expect(svg).toContain('clip-path="url(#now-playing-info)"');
	});

	it('should slide the previous lines up and the new ones in from below during a change of line', () => {
		const svg = build(
			{
				...FRAME,
				lyrics: { current: 'Adiós', next: undefined },
				lyricsTransition: {
					previous: { current: 'Hola', next: 'Adiós' },
					progress: 0.25,
				},
			},
			600
		);

		expect(svg).toMatch(
			/<g transform="translate\(0,-5\)" opacity="0.75">.*>Hola<\/text>.*<\/g><g transform="translate\(0,15\)" opacity="0.25">.*>Adiós<\/text><\/g>/
		);
	});
});
