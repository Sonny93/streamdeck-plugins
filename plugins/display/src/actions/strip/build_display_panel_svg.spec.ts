import { measureStripTexts } from 'deck-kit/strip/measure_strip_texts';
import { StripPanel } from 'deck-kit/strip/strip_panel';
import { describe, expect, it } from 'vitest';

import { buildMonitorSnapshotForTest } from '../../displays/build_monitor_snapshot_for_test';
import { buildDisplayPanelSvg } from './build_display_panel_svg';
import { StripTones } from './strip_tones';

const SNAPSHOT = {
	monitors: [
		buildMonitorSnapshotForTest({
			id: 'main',
			name: 'G95SD (main)',
			isPrimary: true,
			monitorBrightness: 80,
			hdr: { isSupported: true, isEnabled: true },
		}),
		buildMonitorSnapshotForTest({
			id: 'top',
			name: 'PL2530H (top)',
			monitorBrightness: 35,
		}),
		buildMonitorSnapshotForTest({
			id: 'right',
			name: 'PL2530H (right)',
			power: 'standby',
		}),
	],
};

describe('buildDisplayPanelSvg', () => {
	it('should draw the primary monitor in the first column with its brightness and its HDR badge', () => {
		const svg = buildDisplayPanelSvg(SNAPSHOT, 'en', 0);

		expect(svg).toContain('>G95SD (main)<');
		expect(svg).toContain('>80 %<');
		expect(svg).toContain('>HDR<');
	});

	it('should draw the next monitor in the next column', () => {
		expect(buildDisplayPanelSvg(SNAPSHOT, 'en', 1)).toContain('>35 %<');
	});

	it.each([
		['en', 'Off'],
		['fr', 'Éteint'],
	] as const)(
		'should write "%s" as %s and dim the slot of a monitor in standby',
		(language, word) => {
			const svg = buildDisplayPanelSvg(SNAPSHOT, language, 2);

			expect(svg).toContain(`>${word}<`);
			expect(svg).toContain('<g opacity="0.7">');
		}
	);

	it('should draw the plain background in a column without monitor', () => {
		const svg = buildDisplayPanelSvg(SNAPSHOT, 'en', 3);

		expect(svg).not.toContain('<text');
		expect(svg).toContain('translate(-600 0)');
		expect(svg).toContain(StripTones.sky.from);
	});

	it('should draw the plain neutral background in every column when there is no monitor', () => {
		const svg = buildDisplayPanelSvg({ monitors: [] }, 'en', 0);

		expect(svg).not.toContain('<text');
		expect(svg).toContain(StripTones.neutral.from);
	});

	it('should use the neutral background when every monitor is off', () => {
		const svg = buildDisplayPanelSvg(
			{ monitors: [buildMonitorSnapshotForTest({ power: 'standby' })] },
			'en',
			0
		);

		expect(svg).toContain(StripTones.neutral.from);
	});

	it.each([
		['en', 'Unavailable'],
		['fr', 'Indisponible'],
	] as const)(
		'should draw a message in every column when the snapshot is gone, in %s',
		(language, message) => {
			for (const column of [0, 1, 2, 3]) {
				const svg = buildDisplayPanelSvg(undefined, language, column);

				expect(svg).toContain(`>${message}<`);
				expect(svg).not.toContain('%');
			}
		}
	);

	it('should say a monitor with no brightness to change is not adjustable', () => {
		const svg = buildDisplayPanelSvg(
			{
				monitors: [
					buildMonitorSnapshotForTest({
						monitorBrightness: undefined,
						systemBrightness: undefined,
					}),
				],
			},
			'en',
			0
		);

		expect(svg).toContain('>Not adjustable<');
	});

	it.each(['en', 'fr'] as const)(
		'should keep the texts of every slot inside it in %s',
		(language) => {
			for (const column of [0, 1, 2, 3]) {
				for (const text of measureStripTexts(
					buildDisplayPanelSvg(SNAPSHOT, language, column)
				)) {
					expect(text.left, text.text).toBeGreaterThanOrEqual(0);
					expect(text.right, text.text).toBeLessThanOrEqual(
						StripPanel.slotWidth
					);
				}
			}
		}
	);
});
