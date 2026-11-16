import { describe, expect, it } from 'vitest';

import { buildStripBackground } from './build_strip_background';
import { computeContrastRatio } from './compute_contrast_ratio';
import { sampleStripBackground } from './sample_strip_background';
import type { StripBackgroundTone } from './strip_background_tone';
import { StripPanel } from './strip_panel';

const TONE: StripBackgroundTone = {
	from: '#7C2D12',
	to: '#450A0A',
	decoration: '#000000',
};
const COLUMNS = [0, 1, 2, 3] as const;

function readOffset(svg: string): number {
	return Number(/translate\(-(\d+) 0\)/u.exec(svg)?.[1]);
}

function withoutOffset(svg: string): string {
	return svg.replace(/translate\(-\d+ 0\)/u, 'translate(OFFSET)');
}

describe('buildStripBackground', () => {
	it('should give four different slices when the four columns are drawn', () => {
		const slices = COLUMNS.map((column) => buildStripBackground(TONE, column));

		expect(new Set(slices).size).toBe(4);
	});

	it('should shift each slice by one slot so the right edge of a column is the left edge of the next', () => {
		const offsets = COLUMNS.map((column) =>
			readOffset(buildStripBackground(TONE, column))
		);

		expect(offsets).toEqual([0, 200, 400, 600]);
		expect((offsets.at(-1) ?? 0) + StripPanel.slotWidth).toBe(StripPanel.width);
	});

	it('should draw the same panel in every column, only shifted', () => {
		const designs = COLUMNS.map((column) =>
			withoutOffset(buildStripBackground(TONE, column))
		);

		expect(new Set(designs).size).toBe(1);
	});

	it('should span the gradient over the whole panel and not over a slot', () => {
		const svg = buildStripBackground(TONE, 2);

		expect(svg).toContain(
			'gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="800" y2="100"'
		);
		expect(svg).toContain('<rect width="800" height="100"');
	});

	it('should draw the first column when none is given', () => {
		expect(buildStripBackground(TONE)).toBe(buildStripBackground(TONE, 0));
	});

	it('should use the stops and the decoration color of the tone, with no embedded picture', () => {
		const svg = buildStripBackground(TONE);

		expect(svg).toContain(TONE.from);
		expect(svg).toContain(TONE.to);
		expect(svg).toContain(`fill="${TONE.decoration}"`);
		expect(svg).not.toContain('<image');
	});
});

describe('sampleStripBackground', () => {
	it('should be the first stop at the origin and the last stop at the far corner', () => {
		expect(sampleStripBackground(TONE, { x: 0, y: 0 })).toBe('#7c2d12');
		expect(
			sampleStripBackground(TONE, { x: StripPanel.width, y: StripPanel.height })
		).toBe('#450a0a');
	});

	it('should get darker along the panel for a gradient that darkens', () => {
		const left = sampleStripBackground(TONE, { x: 100, y: 50 });
		const right = sampleStripBackground(TONE, { x: 700, y: 50 });

		expect(computeContrastRatio('#FFFFFF', right)).toBeGreaterThan(
			computeContrastRatio('#FFFFFF', left)
		);
	});
});
