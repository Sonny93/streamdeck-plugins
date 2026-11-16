import { measureStripTexts } from 'deck-kit/strip/measure_strip_texts';
import { StripPanel } from 'deck-kit/strip/strip_panel';
import { describe, expect, it } from 'vitest';

import { buildClimateViewForTest } from '../../climate/build_climate_view_for_test';
import { buildClimateDialSvg } from '../dial/build_climate_dial_svg';
import { buildEnergyDialSvg } from '../energy/build_energy_dial_svg';
import { buildFanDialSvg } from '../fan_dial/build_fan_dial_svg';
import { buildInfoDialSvg } from '../info/build_info_dial_svg';

const BIG_ENERGY = {
	heat: { todayKilowattHours: 12.5, lastSevenDaysKilowattHours: 88.8 },
	cool: { todayKilowattHours: 33.3, lastSevenDaysKilowattHours: 99.9 },
};

function expectFits(svg: string): void {
	const texts = measureStripTexts(svg);
	expect(texts.length).toBeGreaterThan(0);
	for (const text of texts) {
		expect(text.left, text.text).toBeGreaterThanOrEqual(0);
		expect(text.right, text.text).toBeLessThanOrEqual(StripPanel.slotWidth);
	}
	for (const first of texts) {
		for (const second of texts) {
			if (first !== second && first.y === second.y) {
				const isApart =
					first.right <= second.left || second.right <= first.left;
				expect(isApart, `${first.text} / ${second.text}`).toBe(true);
			}
		}
	}
}

describe('the texts of the strips', () => {
	it.each(['cool', 'heat', 'auto', 'dry', 'fan'] as const)(
		'should fit the Climate strip in %s mode, with the longest values',
		(mode) => {
			const view = buildClimateViewForTest({
				state: {
					mode,
					targetTemperature: mode === 'dry' || mode === 'fan' ? null : 29.5,
				},
				sensors: { indoorTemperature: 33.5, outdoorTemperature: -12.5 },
			});

			expectFits(buildClimateDialSvg(view));
			expectFits(buildClimateDialSvg(view, 30, 3));
		}
	);

	it('should fit the Info strip with every special mode and the longest compressor text', () => {
		const view = buildClimateViewForTest({
			state: { specialModes: ['powerful', 'econo', 'streamer'] },
			sensors: { outdoorTemperature: -12.5, compressorFrequency: 0 },
		});

		expectFits(buildInfoDialSvg(view));
	});

	it.each(['auto', 'silent', 5] as const)(
		'should fit the Ventilation strip with the fan rate %s',
		(fanRate) => {
			expectFits(
				buildFanDialSvg(
					buildClimateViewForTest({ state: { fanRate, fanDirection: 'both' } })
				)
			);
		}
	);

	it('should fit the Energy strip with large values', () => {
		expectFits(
			buildEnergyDialSvg(buildClimateViewForTest({ energy: BIG_ENERGY }))
		);
	});

	it.each(['unconfigured', 'loading', 'unreachable'] as const)(
		'should fit the message of the %s status',
		(status) => {
			const view = buildClimateViewForTest({ status });

			expectFits(buildClimateDialSvg(view));
		}
	);
});
