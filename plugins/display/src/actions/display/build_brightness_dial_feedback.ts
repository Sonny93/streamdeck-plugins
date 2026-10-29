import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import type { BrightnessDialFeedback } from './brightness_dial_feedback';
import type { DisplayActionConfig } from './display_action_config';
import { readBrightness } from './read_brightness';

const ACTIVE_OPACITY = 1;
const FADED_OPACITY = 0.4;

function titleOf(
	monitors: readonly MonitorSnapshot[],
	config: DisplayActionConfig
): string {
	if (config.target.kind === 'all') {
		return 'All monitors';
	}
	return monitors[0]?.name ?? 'Brightness';
}

/**
 * Shows the monitors of a "Brightness" dial with their brightness (the average for all monitors),
 * the bar faded while they are off, or why there is nothing to show.
 */
export function buildBrightnessDialFeedback(
	monitors: readonly MonitorSnapshot[],
	config: DisplayActionConfig
): BrightnessDialFeedback {
	const brightnesses = monitors.flatMap((monitor) => {
		const brightness = readBrightness(monitor, config.brightnessControl);
		return brightness === undefined ? [] : [brightness];
	});
	const title = titleOf(monitors, config);
	if (brightnesses.length === 0) {
		return {
			title,
			value: monitors.length === 0 ? 'No monitor' : 'Not adjustable',
			indicator: { value: 0, opacity: FADED_OPACITY },
		};
	}
	const average = Math.round(
		brightnesses.reduce((total, brightness) => total + brightness, 0) /
			brightnesses.length
	);
	const isOff = monitors.every((monitor) => monitor.power !== 'on');
	return {
		title,
		value: isOff ? 'Off' : `${String(average)} %`,
		indicator: {
			value: average,
			opacity: isOff ? FADED_OPACITY : ACTIVE_OPACITY,
		},
	};
}
