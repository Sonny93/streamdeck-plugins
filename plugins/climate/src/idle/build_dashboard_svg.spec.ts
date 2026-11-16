import { measureStripTexts } from 'deck-kit/strip/measure_strip_texts';
import { StripPanel } from 'deck-kit/strip/strip_panel';
import { describe, expect, it } from 'vitest';

import { StripTones } from '../actions/strip/strip_tones';
import { buildClimateViewForTest } from '../climate/build_climate_view_for_test';
import { buildDashboardContent } from './build_dashboard_content';
import { buildDashboardSvg } from './build_dashboard_svg';

const ENERGY = {
	heat: { todayKilowattHours: 0.5, lastSevenDaysKilowattHours: 3.1 },
	cool: { todayKilowattHours: 0.7, lastSevenDaysKilowattHours: 0.6 },
};
const COLUMNS = [0, 1, 2, 3] as const;

function contentOf(view = buildClimateViewForTest()): string {
	return buildDashboardContent(
		view,
		view.state ?? buildClimateViewForTest().state!
	);
}

describe('buildDashboardSvg', () => {
	it('should draw the room temperature very large under its caption in the first slot', () => {
		const svg = buildDashboardSvg(buildClimateViewForTest(), 0);

		expect(svg).toContain('>PIÈCE<');
		expect(svg).toContain('font-size="54" font-weight="bold">23°<');
	});

	it('should draw the mode and the target temperature in the second slot', () => {
		const svg = buildDashboardSvg(
			buildClimateViewForTest({
				state: { mode: 'heat', targetTemperature: 21.5 },
			}),
			1
		);

		expect(svg).toContain('>Chaud 21,5°<');
	});

	it('should draw only the mode when the mode has no target', () => {
		const svg = buildDashboardSvg(
			buildClimateViewForTest({
				state: { mode: 'dry', targetTemperature: null },
			}),
			1
		);

		expect(svg).toContain('>Déshu.<');
	});

	it('should draw the active special modes small when the unit is on', () => {
		const svg = buildDashboardSvg(
			buildClimateViewForTest({
				state: { specialModes: ['powerful', 'econo'] },
			}),
			1
		);

		expect(svg).toContain('>Puissant, Éco<');
	});

	it('should say the unit is off, dimmed over the neutral background, when it is off', () => {
		const svg = buildDashboardSvg(
			buildClimateViewForTest({
				state: { isPowered: false, specialModes: ['powerful'] },
			}),
			1
		);

		expect(svg).toContain('>Éteinte<');
		expect(svg).not.toContain('Puissant');
		expect(svg).toContain('<g opacity="0.7">');
		expect(svg).toContain(StripTones.neutral.from);
	});

	it('should draw the outdoor temperature and the compressor state in the third slot', () => {
		const running = buildDashboardSvg(
			buildClimateViewForTest({
				sensors: { outdoorTemperature: 4.5, compressorFrequency: 20 },
			}),
			2
		);
		const idle = buildDashboardSvg(
			buildClimateViewForTest({ sensors: { compressorFrequency: 0 } }),
			2
		);

		expect(running).toContain('>EXTÉRIEUR<');
		expect(running).toContain('>4,5°<');
		expect(running).toContain('>Compresseur actif<');
		expect(idle).toContain('>Compresseur à l&apos;arrêt<');
	});

	it('should draw the fan rate and the energy of today in the fourth slot', () => {
		const svg = buildDashboardSvg(
			buildClimateViewForTest({ state: { fanRate: 'silent' }, energy: ENERGY }),
			3
		);

		expect(svg).toContain('>Ventil. Silence<');
		expect(svg).toContain('>Aujourd&apos;hui 1,2 kWh<');
	});

	it('should draw a dash for the energy while it is unknown', () => {
		const svg = buildDashboardSvg(buildClimateViewForTest(), 3);

		expect(svg).toContain('>Aujourd&apos;hui –<');
	});

	it('should give a different slice for each of the four columns', () => {
		const slices = COLUMNS.map((column) =>
			buildDashboardSvg(buildClimateViewForTest(), column)
		);

		expect(new Set(slices).size).toBe(4);
	});

	it('should shift the design by one slot per column so the slices join into one panel', () => {
		const offsets = COLUMNS.map((column) =>
			buildDashboardSvg(buildClimateViewForTest(), column).match(
				/translate\(-(\d+) 0\)/gu
			)
		);

		expect(offsets).toEqual([
			['translate(-0 0)', 'translate(-0 0)'],
			['translate(-200 0)', 'translate(-200 0)'],
			['translate(-400 0)', 'translate(-400 0)'],
			['translate(-600 0)', 'translate(-600 0)'],
		]);
	});

	it.each([
		['unconfigured', 'Adresse à définir'],
		['loading', 'Chargement...'],
		['unreachable', 'Injoignable'],
	] as const)(
		'should draw the message strip when the status is %s',
		(status, message) => {
			const svg = buildDashboardSvg(buildClimateViewForTest({ status }), 1);

			expect(svg).toContain(`>${message}<`);
			expect(svg).not.toContain('PIÈCE');
		}
	);
});

describe('the texts of the dashboard', () => {
	it.each(['cool', 'heat', 'auto', 'dry', 'fan'] as const)(
		'should each sit inside one slot of the panel in %s mode, with the longest values',
		(mode) => {
			const view = buildClimateViewForTest({
				state: {
					mode,
					targetTemperature: mode === 'dry' || mode === 'fan' ? null : 29.5,
					fanRate: 'silent',
					specialModes: ['powerful', 'econo', 'streamer'],
				},
				sensors: {
					indoorTemperature: 33.5,
					outdoorTemperature: -12.5,
					compressorFrequency: 0,
				},
				energy: {
					heat: { todayKilowattHours: 12.5, lastSevenDaysKilowattHours: 0 },
					cool: { todayKilowattHours: 33.3, lastSevenDaysKilowattHours: 0 },
				},
			});

			const texts = measureStripTexts(contentOf(view));

			expect(texts.length).toBeGreaterThan(5);
			for (const text of texts) {
				const slot = Math.floor(text.left / StripPanel.slotWidth);
				expect(text.left, text.text).toBeGreaterThanOrEqual(
					slot * StripPanel.slotWidth
				);
				expect(text.right, text.text).toBeLessThanOrEqual(
					(slot + 1) * StripPanel.slotWidth
				);
			}
		}
	);

	it('should not overlap when they share a line', () => {
		const texts = measureStripTexts(contentOf());

		for (const first of texts) {
			for (const second of texts) {
				if (first !== second && first.y === second.y) {
					expect(
						first.right <= second.left || second.right <= first.left,
						`${first.text} / ${second.text}`
					).toBe(true);
				}
			}
		}
	});
});
