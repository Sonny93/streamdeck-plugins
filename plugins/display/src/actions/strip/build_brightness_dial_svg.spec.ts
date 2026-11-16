import { measureStripTexts } from 'deck-kit/strip/measure_strip_texts';
import { StripPanel } from 'deck-kit/strip/strip_panel';
import { describe, expect, it } from 'vitest';

import { buildMonitorSnapshotForTest } from '../../displays/build_monitor_snapshot_for_test';
import { describeMonitorName } from '../../displays/describe_monitor_name';
import { UserSetup } from '../../displays/user_setup';
import { readDisplayActionConfig } from '../display/read_display_action_config';
import { buildBrightnessDialSvg } from './build_brightness_dial_svg';
import { StripPalette } from './strip_palette';
import { StripTones } from './strip_tones';

const ONE_MONITOR = readDisplayActionConfig(
	{ monitor: 'top' },
	{ offersAll: true }
);
const ALL_MONITORS = readDisplayActionConfig(
	{ monitor: 'all' },
	{ offersAll: true }
);
const LANGUAGES = ['en', 'fr'] as const;
const FIXTURE_DISPLAYS = Object.values(UserSetup);
const FIXTURE_NAMES = FIXTURE_DISPLAYS.map((display) =>
	describeMonitorName(display, FIXTURE_DISPLAYS)
);
const LONGEST_FIXTURE_NAME =
	FIXTURE_NAMES.toSorted((first, second) => second.length - first.length)[0] ??
	'';
const OVERLONG_NAME = `${LONGEST_FIXTURE_NAME} on the second HDMI connector of the dock`;

describe('buildBrightnessDialSvg', () => {
	it('should show the monitor name, its brightness and a bar when the monitor is lit', () => {
		const svg = buildBrightnessDialSvg(
			[buildMonitorSnapshotForTest()],
			ONE_MONITOR,
			'en'
		);

		expect(svg).toContain('>PL2530H (top)<');
		expect(svg).toContain('>60 %<');
		expect(svg).toContain(`fill="${StripPalette.accent}" fill-opacity="1"`);
		expect(svg).toContain(StripTones.sky.from);
		expect(svg).toContain('<g opacity="1">');
	});

	it.each([
		['en', 'All monitors'],
		['fr', 'Tous les écrans'],
	] as const)(
		'should name the group in %s and show the average brightness of every monitor',
		(language, title) => {
			const svg = buildBrightnessDialSvg(
				[
					buildMonitorSnapshotForTest({ monitorBrightness: 40 }),
					buildMonitorSnapshotForTest({ monitorBrightness: 100 }),
				],
				ALL_MONITORS,
				language
			);

			expect(svg).toContain(`>${title}<`);
			expect(svg).toContain('>70 %<');
		}
	);

	it.each([
		['en', 'Off'],
		['fr', 'Éteint'],
	] as const)(
		'should write "%s" as %s and dim the picture over the neutral background when the monitor is off',
		(language, word) => {
			const svg = buildBrightnessDialSvg(
				[buildMonitorSnapshotForTest({ power: 'standby' })],
				ONE_MONITOR,
				language
			);

			expect(svg).toContain(`>${word}<`);
			expect(svg).toContain('<g opacity="0.7">');
			expect(svg).toContain(StripTones.neutral.from);
			expect(svg).toContain('fill-opacity="0.4"');
		}
	);

	it('should treat a monitor under a black screen as off', () => {
		const svg = buildBrightnessDialSvg(
			[buildMonitorSnapshotForTest({ power: 'blackScreen' })],
			ONE_MONITOR,
			'en'
		);

		expect(svg).toContain('>Off<');
	});

	it('should draw the HDR badge while HDR is on and not otherwise', () => {
		const hdr = buildBrightnessDialSvg(
			[
				buildMonitorSnapshotForTest({
					hdr: { isSupported: true, isEnabled: true },
				}),
			],
			ONE_MONITOR,
			'en'
		);
		const sdr = buildBrightnessDialSvg(
			[buildMonitorSnapshotForTest()],
			ONE_MONITOR,
			'en'
		);

		expect(hdr).toContain('>HDR<');
		expect(sdr).not.toContain('>HDR<');
	});

	it.each([
		['en', 'No monitor'],
		['fr', 'Aucun écran'],
	] as const)(
		'should say "%s" as %s when there is no monitor',
		(language, message) => {
			const svg = buildBrightnessDialSvg([], ONE_MONITOR, language);

			expect(svg).toContain(`>${message}<`);
			expect(svg).toContain(
				'>Brightness<'.replace(
					'Brightness',
					language === 'en' ? 'Brightness' : 'Luminosité'
				)
			);
		}
	);

	it.each([
		['en', 'Not adjustable'],
		['fr', 'Non réglable'],
	] as const)(
		'should say it is %s in %s when no monitor has a brightness to change',
		(language, message) => {
			const svg = buildBrightnessDialSvg(
				[
					buildMonitorSnapshotForTest({
						monitorBrightness: undefined,
						systemBrightness: undefined,
					}),
				],
				ONE_MONITOR,
				language
			);

			expect(svg).toContain(`>${message}<`);
		}
	);

	it('should draw the slice of the column it is given of the continuous background', () => {
		const svg = buildBrightnessDialSvg(
			[buildMonitorSnapshotForTest()],
			ONE_MONITOR,
			'en',
			3
		);

		expect(svg).toContain('translate(-600 0)');
		expect(svg).toContain('width="200" height="100"');
	});
});

describe.each(LANGUAGES)(
	'the texts of the brightness strip in %s',
	(language) => {
		function expectFits(svg: string, badgeLeft?: number): void {
			const texts = measureStripTexts(svg);
			expect(texts.length).toBeGreaterThan(1);
			for (const text of texts) {
				expect(text.left, text.text).toBeGreaterThanOrEqual(0);
				expect(text.right, text.text).toBeLessThanOrEqual(StripPanel.slotWidth);
			}
			const title = texts.find((text) => text.y === 22);
			if (badgeLeft !== undefined && title !== undefined) {
				expect(title.right, title.text).toBeLessThanOrEqual(badgeLeft);
			}
		}

		it.each([...FIXTURE_NAMES, OVERLONG_NAME])(
			'should fit the strip for the monitor name "%s"',
			(name) => {
				expectFits(
					buildBrightnessDialSvg(
						[buildMonitorSnapshotForTest({ name })],
						ONE_MONITOR,
						language
					)
				);
			}
		);

		it('should keep the longest name clear of the HDR badge', () => {
			const monitors = [
				buildMonitorSnapshotForTest({
					name: OVERLONG_NAME,
					hdr: { isSupported: true, isEnabled: true },
				}),
			];

			expectFits(buildBrightnessDialSvg(monitors, ONE_MONITOR, language), 150);
		});

		it('should fit the strip while the monitors are off, absent or not adjustable', () => {
			expectFits(
				buildBrightnessDialSvg(
					[
						buildMonitorSnapshotForTest({
							name: OVERLONG_NAME,
							power: 'standby',
						}),
					],
					ONE_MONITOR,
					language
				)
			);
			expectFits(buildBrightnessDialSvg([], ONE_MONITOR, language));
			expectFits(
				buildBrightnessDialSvg(
					[
						buildMonitorSnapshotForTest({
							monitorBrightness: undefined,
							systemBrightness: undefined,
						}),
					],
					ALL_MONITORS,
					language
				)
			);
		});
	}
);
