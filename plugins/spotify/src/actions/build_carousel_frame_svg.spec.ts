import { describe, expect, it } from 'vitest';

import { buildCarouselFrameSvg } from './build_carousel_frame_svg';
import { CarouselMetrics } from './carousel_metrics';

const COVER = 'data:image/jpeg;base64,AQID';
const HEART_COLOR = CarouselMetrics.badge.heartColor;

function build(
	overrides: Partial<Parameters<typeof buildCarouselFrameSvg>[0]>
): string {
	return buildCarouselFrameSvg({
		position: 0,
		slots: [{ offset: 0, coverDataUrl: COVER }],
		title: 'Road trip',
		positionLabel: '12 / 37',
		containsPlayingTrack: false,
		...overrides,
	});
}

function countImages(svg: string): number {
	return svg.split('<image ').length - 1;
}

describe('buildCarouselFrameSvg', () => {
	it('should draw a 200 by 100 svg on a black background', () => {
		const svg = build({});

		expect(svg).toContain('width="200" height="100" viewBox="0 0 200 100"');
		expect(svg).toContain('<rect width="200" height="100" fill="#000000"/>');
	});

	it('should draw the centered cover at the large size', () => {
		expect(build({})).toContain('<image x="68" y="8" width="64" height="64"');
	});

	it('should draw a cover at the side size once the offset reaches one slot', () => {
		const svg = build({ slots: [{ offset: 1, coverDataUrl: COVER }] });

		expect(svg).toContain('<image x="138" y="20" width="40" height="40"');
	});

	it('should keep the side size and opacity beyond one slot', () => {
		const svg = build({ slots: [{ offset: 1.5, coverDataUrl: COVER }] });

		expect(svg).toContain('width="40" height="40"');
		expect(svg).toContain('<g opacity="0.45">');
	});

	it('should ease the size between the centered and the side values', () => {
		const svg = build({ slots: [{ offset: 0.5, coverDataUrl: COVER }] });

		expect(svg).toContain('width="52" height="52"');
	});

	it('should embed the cover with an xlink href and the xlink namespace', () => {
		const svg = build({});

		expect(svg).toContain(`xlink:href="${COVER}"`);
		expect(svg).not.toContain(` href="${COVER}"`);
		expect(svg).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
	});

	it('should round the corners of a cover with a clip path', () => {
		expect(build({})).toContain('<clipPath id="clip-0">');
	});

	it('should skip the slots outside the strip', () => {
		const svg = build({
			slots: [
				{ offset: 0, coverDataUrl: COVER },
				{ offset: 2.5, coverDataUrl: COVER },
				{ offset: -2.5, coverDataUrl: COVER },
			],
		});

		expect(countImages(svg)).toBe(1);
	});

	it('should keep a slot that is partly inside the strip', () => {
		const svg = build({ slots: [{ offset: 2, coverDataUrl: COVER }] });

		expect(countImages(svg)).toBe(1);
	});

	it('should draw the fallback cover as shapes when the cover is missing', () => {
		const svg = build({ slots: [{ offset: 0, coverDataUrl: undefined }] });

		expect(svg).toContain('<linearGradient');
		expect(svg).toContain('fill="url(#gradient-0)"');
		expect(countImages(svg)).toBe(0);
		expect(svg.split('<svg').length - 1).toBe(1);
	});

	it('should show the title', () => {
		expect(build({})).toContain('>Road trip</text>');
	});

	it('should escape the title', () => {
		expect(build({ title: '<Rock> & "Roll"' })).toContain(
			'&lt;Rock&gt; &amp; &quot;Roll&quot;'
		);
	});

	it('should truncate a long title with an ellipsis', () => {
		const maxLength = CarouselMetrics.title.maxLength;

		const svg = build({ title: 'A'.repeat(maxLength + 10) });

		expect(svg).toContain(`>${'A'.repeat(maxLength - 1)}…</text>`);
	});

	it('should show the position label', () => {
		expect(build({})).toContain('>12 / 37</text>');
	});

	it('should leave out the position label when it is empty', () => {
		expect(build({ positionLabel: '' })).not.toContain('text-anchor="end"');
	});

	it('should draw the heart badge only when the playlist contains the playing track', () => {
		expect(build({ containsPlayingTrack: true })).toContain(HEART_COLOR);
		expect(build({ containsPlayingTrack: false })).not.toContain(HEART_COLOR);
	});

	it('should anchor the heart badge to the cover nearest to the center', () => {
		const svg = build({
			containsPlayingTrack: true,
			slots: [
				{ offset: -1, coverDataUrl: COVER },
				{ offset: 0.2, coverDataUrl: COVER },
				{ offset: 1.2, coverDataUrl: COVER },
			],
		});

		expect(svg).toContain('<circle cx="135.2" cy="16.4"');
	});

	it('should draw the nearest cover after the farther ones', () => {
		const svg = build({
			slots: [
				{ offset: 0, coverDataUrl: COVER },
				{ offset: 1, coverDataUrl: COVER },
				{ offset: -1, coverDataUrl: COVER },
			],
		});

		expect(svg.lastIndexOf('width="64"')).toBeGreaterThan(
			svg.lastIndexOf('width="40"')
		);
	});

	it('should draw the backdrop behind the covers', () => {
		const svg = build({
			backdrop: { coverDataUrl: 'data:backdrop', column: 3 },
		});

		expect(svg.indexOf('xlink:href="data:backdrop"')).toBeLessThan(
			svg.indexOf(`xlink:href="${COVER}"`)
		);
		expect(svg).toContain('<image x="-600" ');
	});
});
