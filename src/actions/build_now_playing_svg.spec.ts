import { describe, expect, it } from 'vitest';

import type { NowPlayingFrame } from './now_playing_frame';
import { buildNowPlayingSvg } from './build_now_playing_svg';

const COVER = 'data:image/jpeg;base64,AQID';
const FRAME: NowPlayingFrame = {
	title: 'Kosandra',
	artistNames: ['Miyagi & Andy Panda'],
	coverDataUrl: COVER,
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
});
