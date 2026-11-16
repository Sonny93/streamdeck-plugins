import type { Language } from 'deck-kit/i18n/language';

import type { MonitorSnapshot } from '../../displays/monitor_snapshot';
import { displayMessages } from '../../i18n/display_messages';
import type { DisplayActionConfig } from '../display/display_action_config';
import { readBrightness } from '../display/read_brightness';
import type { BrightnessStripModel } from './brightness_strip_model';
import { buildBrightnessStripContent } from './build_brightness_strip_content';
import { resolveStripTone } from './resolve_strip_tone';
import { wrapDisplayStripSvg } from './wrap_display_strip_svg';

function buildTitle(
	monitors: readonly MonitorSnapshot[],
	config: DisplayActionConfig,
	language: Language
): string {
	if (config.target.kind === 'all') {
		return displayMessages.text('allMonitors', language);
	}
	return monitors[0]?.name ?? displayMessages.text('brightnessTitle', language);
}

function buildModel(
	monitors: readonly MonitorSnapshot[],
	config: DisplayActionConfig,
	language: Language
): BrightnessStripModel {
	const title = buildTitle(monitors, config, language);
	const hasHdr = monitors.some((monitor) => monitor.hdr.isEnabled);
	const brightnesses = monitors.flatMap((monitor) => {
		const brightness = readBrightness(monitor, config.brightnessControl);
		return brightness === undefined ? [] : [brightness];
	});
	if (brightnesses.length === 0) {
		return {
			title,
			valueText: displayMessages.text(
				monitors.length === 0 ? 'noMonitor' : 'notAdjustable',
				language
			),
			isMessage: true,
			percent: undefined,
			isOff: false,
			hasHdr,
		};
	}
	const average = Math.round(
		brightnesses.reduce((total, brightness) => total + brightness, 0) /
			brightnesses.length
	);
	const isOff = monitors.every((monitor) => monitor.power !== 'on');
	return {
		title,
		valueText: isOff
			? displayMessages.text('monitorOff', language)
			: `${String(average)} %`,
		isMessage: isOff,
		percent: average,
		isOff,
		hasHdr,
	};
}

/**
 * Draws the strip of a "Brightness" dial over its slice (`column`) of the continuous background: the name of its monitors,
 * their brightness large with a bar (the average for all monitors), an HDR badge while HDR is on, and why there is nothing to show.
 * While the monitors are off the picture is dimmed and says so in words. Texts are in `language`.
 */
export function buildBrightnessDialSvg(
	monitors: readonly MonitorSnapshot[],
	config: DisplayActionConfig,
	language: Language,
	column = 0
): string {
	const model = buildModel(monitors, config, language);
	return wrapDisplayStripSvg({
		tone: resolveStripTone(monitors),
		column,
		content: buildBrightnessStripContent(model),
		isDimmed: model.isOff,
	});
}
