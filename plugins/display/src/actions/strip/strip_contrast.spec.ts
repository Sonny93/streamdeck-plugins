import {
	computeContrastRatio,
	computeLuminance,
} from 'deck-kit/strip/compute_contrast_ratio';
import { sampleStripBackground } from 'deck-kit/strip/sample_strip_background';
import { StripPanel } from 'deck-kit/strip/strip_panel';
import { DIMMED_OPACITY } from 'deck-kit/strip/wrap_strip_svg';
import { describe, expect, it } from 'vitest';

import { buildMonitorSnapshotForTest } from '../../displays/build_monitor_snapshot_for_test';
import { resolveStripTone } from './resolve_strip_tone';
import { StripPalette } from './strip_palette';
import type { StripTone } from './strip_tone';
import { StripTones } from './strip_tones';

const MINIMUM_CONTRAST = 4.5;
const TONES = ['sky', 'neutral'] as const satisfies readonly StripTone[];

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

describe('the strip backgrounds of the display plugin', () => {
	it.each(TONES)(
		'should keep every text color readable over the whole panel in the %s tone',
		(tone) => {
			for (let x = 0; x <= StripPanel.width; x += 50) {
				for (const y of [0, 50, StripPanel.height]) {
					const background = sampleStripBackground(StripTones[tone], { x, y });
					for (const color of Object.values(StripPalette)) {
						expect(
							computeContrastRatio(color, background),
							`${tone} ${x},${y} ${color}`
						).toBeGreaterThanOrEqual(MINIMUM_CONTRAST);
					}
				}
			}
		}
	);

	it.each(TONES)(
		'should keep the dimmed text readable over the lightest point of the %s tone',
		(tone) => {
			const lightest =
				[StripTones[tone].from, StripTones[tone].to].toSorted(
					(first, second) => computeLuminance(second) - computeLuminance(first)
				)[0] ?? '';

			for (const color of [StripPalette.primary, StripPalette.secondary]) {
				const dimmed = blendOver(color, lightest, DIMMED_OPACITY);
				expect(
					computeContrastRatio(dimmed, lightest),
					`${tone} ${color}`
				).toBeGreaterThanOrEqual(MINIMUM_CONTRAST);
			}
		}
	);
});

describe('the accent of the display plugin when dimmed', () => {
	it.each(TONES)(
		'should stay visible as a graphic over the lightest point of the %s tone',
		(tone) => {
			const lightest =
				[StripTones[tone].from, StripTones[tone].to].toSorted(
					(first, second) => computeLuminance(second) - computeLuminance(first)
				)[0] ?? '';
			const dimmed = blendOver(StripPalette.accent, lightest, DIMMED_OPACITY);

			expect(computeContrastRatio(dimmed, lightest)).toBeGreaterThanOrEqual(3);
		}
	);
});

describe('resolveStripTone', () => {
	it('should be sky blue while a monitor is lit', () => {
		expect(
			resolveStripTone([
				buildMonitorSnapshotForTest({ power: 'standby' }),
				buildMonitorSnapshotForTest(),
			])
		).toBe('sky');
	});

	it.each([[[]], [[buildMonitorSnapshotForTest({ power: 'blackScreen' })]]])(
		'should be neutral when every monitor is off or there is none',
		(monitors) => {
			expect(resolveStripTone(monitors)).toBe('neutral');
		}
	);
});
