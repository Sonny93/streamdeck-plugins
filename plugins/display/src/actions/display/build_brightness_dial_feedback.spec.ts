import { describe, expect, it } from 'vitest';

import { buildMonitorSnapshotForTest } from '../../displays/build_monitor_snapshot_for_test';
import { buildBrightnessDialFeedback } from './build_brightness_dial_feedback';
import { readDisplayActionConfig } from './read_display_action_config';

const ONE_MONITOR = readDisplayActionConfig(
	{ monitor: 'top' },
	{ offersAll: true }
);
const ALL_MONITORS = readDisplayActionConfig(
	{ monitor: 'all' },
	{ offersAll: true }
);

describe('buildBrightnessDialFeedback', () => {
	it('shows the monitor with its brightness', () => {
		expect(
			buildBrightnessDialFeedback([buildMonitorSnapshotForTest()], ONE_MONITOR)
		).toEqual({
			title: 'PL2530H (top)',
			value: '60 %',
			indicator: { value: 60, opacity: 1 },
		});
	});

	it('shows the average brightness of every monitor', () => {
		const feedback = buildBrightnessDialFeedback(
			[
				buildMonitorSnapshotForTest({ monitorBrightness: 40 }),
				buildMonitorSnapshotForTest({ monitorBrightness: 100 }),
			],
			ALL_MONITORS
		);

		expect([feedback.title, feedback.value]).toEqual(['All monitors', '70 %']);
	});

	it('fades the bar while the monitor is off', () => {
		const feedback = buildBrightnessDialFeedback(
			[buildMonitorSnapshotForTest({ power: 'blackScreen' })],
			ONE_MONITOR
		);

		expect([feedback.value, feedback.indicator.opacity]).toEqual(['Off', 0.4]);
	});

	it('tells when there is no monitor', () => {
		expect(buildBrightnessDialFeedback([], ONE_MONITOR).value).toBe(
			'No monitor'
		);
	});
});
