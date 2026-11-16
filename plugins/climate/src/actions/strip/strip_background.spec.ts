import { describe, expect, it } from 'vitest';

import { buildClimateViewForTest } from '../../climate/build_climate_view_for_test';
import { buildStripBackground } from './build_strip_background';
import {
	computeContrastRatio,
	computeLuminance,
} from './compute_contrast_ratio';
import { resolveStripTone } from './resolve_strip_tone';
import { sampleStripBackground } from './sample_strip_background';
import { StripPalette } from './strip_palette';
import { StripPanel } from './strip_panel';
import type { StripTone } from './strip_tone';
import { StripTones } from './strip_tones';
import { DIMMED_OPACITY } from './wrap_strip_svg';

const MINIMUM_CONTRAST = 4.5;
const TONES = [
	'heat',
	'cool',
	'teal',
	'neutral',
] as const satisfies readonly StripTone[];

function lightestStop(tone: StripTone): string {
	const { from, to } = StripTones[tone];
	return computeLuminance(from) >= computeLuminance(to) ? from : to;
}

function blendOver(
	foreground: string,
	background: string,
	opacity: number
): string {
	const channels = [1, 3, 5].map((start) => {
		const front = Number.parseInt(foreground.slice(start, start + 2), 16);
		const back = Number.parseInt(background.slice(start, start + 2), 16);
		return Math.round(front * opacity + back * (1 - opacity));
	});
	return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

describe('the strip backgrounds', () => {
	it.each(TONES)(
		'should keep every text color readable over the lightest stop of the %s tone',
		(tone) => {
			const background = lightestStop(tone);

			for (const color of Object.values(StripPalette)) {
				expect(computeContrastRatio(color, background)).toBeGreaterThanOrEqual(
					MINIMUM_CONTRAST
				);
			}
		}
	);

	it('should keep the dimmed text readable over the neutral tone that shows while the unit is off', () => {
		const background = lightestStop('neutral');

		for (const color of Object.values(StripPalette)) {
			const dimmed = blendOver(color, background, DIMMED_OPACITY);
			expect(computeContrastRatio(dimmed, background)).toBeGreaterThanOrEqual(
				MINIMUM_CONTRAST
			);
		}
	});

	it.each(TONES)(
		'should keep every text color readable at every point of the whole panel in the %s tone',
		(tone) => {
			const lightest = sampleStripBackground(tone, { x: 0, y: 0 });

			for (let x = 0; x <= StripPanel.width; x += 50) {
				for (const y of [0, 50, StripPanel.height]) {
					const background = sampleStripBackground(tone, { x, y });
					expect(computeLuminance(background)).toBeLessThanOrEqual(
						computeLuminance(lightest)
					);
					for (const color of Object.values(StripPalette)) {
						expect(
							computeContrastRatio(color, background)
						).toBeGreaterThanOrEqual(MINIMUM_CONTRAST);
					}
				}
			}
		}
	);

	it('should draw the gradient of the tone without any embedded picture', () => {
		const svg = buildStripBackground('heat');

		expect(svg).toContain(StripTones.heat.from);
		expect(svg).toContain(StripTones.heat.to);
		expect(svg).not.toContain('<image');
	});
});

describe('resolveStripTone', () => {
	it.each([
		['heat', 'heat'],
		['cool', 'cool'],
		['auto', 'teal'],
		['dry', 'teal'],
		['fan', 'teal'],
	] as const)(
		'should use the %s tone when the unit is on in %s mode',
		(mode, expected) => {
			const tone = resolveStripTone(
				buildClimateViewForTest({ state: { mode } })
			);

			expect(tone).toBe(expected);
		}
	);

	it('should be neutral when the unit is off', () => {
		const view = buildClimateViewForTest({
			state: { isPowered: false, mode: 'heat' },
		});

		expect(resolveStripTone(view)).toBe('neutral');
	});

	it('should be neutral when the unit is not ready', () => {
		const view = buildClimateViewForTest({ status: 'unreachable' });

		expect(resolveStripTone(view)).toBe('neutral');
	});
});

describe('buildStripBackground slices', () => {
	function readOffset(svg: string): number {
		return Number(/translate\(-(\d+) 0\)/u.exec(svg)?.[1]);
	}

	function stripOffset(svg: string): string {
		return svg.replace(/translate\(-\d+ 0\)/u, 'translate(OFFSET)');
	}

	const COLUMNS = [0, 1, 2, 3] as const;

	it('should give four different slices when the four columns are drawn', () => {
		const slices = COLUMNS.map((column) =>
			buildStripBackground('cool', column)
		);

		expect(new Set(slices).size).toBe(4);
	});

	it('should shift each slice by one slot so the right edge of a column is the left edge of the next', () => {
		const offsets = COLUMNS.map((column) =>
			readOffset(buildStripBackground('heat', column))
		);

		expect(offsets).toEqual([0, 200, 400, 600]);
		expect(offsets.at(-1)! + StripPanel.slotWidth).toBe(StripPanel.width);
	});

	it('should draw the same panel in every column, only shifted', () => {
		const designs = COLUMNS.map((column) =>
			stripOffset(buildStripBackground('teal', column))
		);

		expect(new Set(designs).size).toBe(1);
	});

	it('should span the gradient over the whole panel and not over a slot', () => {
		const svg = buildStripBackground('cool', 2);

		expect(svg).toContain(
			'gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="800" y2="100"'
		);
		expect(svg).toContain('<rect width="800" height="100"');
	});

	it('should draw the first column when none is given', () => {
		expect(buildStripBackground('neutral')).toBe(
			buildStripBackground('neutral', 0)
		);
	});
});
