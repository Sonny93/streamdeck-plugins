import {
	computeContrastRatio,
	computeLuminance,
} from 'deck-kit/strip/compute_contrast_ratio';
import { sampleStripBackground } from 'deck-kit/strip/sample_strip_background';
import { StripPanel } from 'deck-kit/strip/strip_panel';
import { DIMMED_OPACITY } from 'deck-kit/strip/wrap_strip_svg';
import { describe, expect, it } from 'vitest';

import { buildClimateViewForTest } from '../../climate/build_climate_view_for_test';
import { resolveStripTone } from './resolve_strip_tone';
import { StripPalette } from './strip_palette';
import type { StripTone } from './strip_tone';
import { StripTones } from './strip_tones';

const MINIMUM_CONTRAST = 4.5;
const MINIMUM_GRAPHIC_CONTRAST = 3;
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
		'should keep the dimmed accent visible as a graphic over the lightest stop of the %s tone',
		(tone) => {
			const background = lightestStop(tone);
			const dimmed = blendOver(StripPalette.accent, background, DIMMED_OPACITY);

			expect(computeContrastRatio(dimmed, background)).toBeGreaterThanOrEqual(
				MINIMUM_GRAPHIC_CONTRAST
			);
		}
	);

	it.each(TONES)(
		'should keep every text color readable at every point of the whole panel in the %s tone',
		(tone) => {
			const lightest = sampleStripBackground(StripTones[tone], { x: 0, y: 0 });

			for (let x = 0; x <= StripPanel.width; x += 50) {
				for (const y of [0, 50, StripPanel.height]) {
					const background = sampleStripBackground(StripTones[tone], { x, y });
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
