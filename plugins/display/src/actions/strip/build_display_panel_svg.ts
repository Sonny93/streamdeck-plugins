import type { Language } from 'deck-kit/i18n/language';
import { buildStripMessageSvg } from 'deck-kit/strip/build_strip_message_svg';

import type { DisplaySnapshot } from '../../displays/display_snapshot';
import { displayMessages } from '../../i18n/display_messages';
import { readBrightness } from '../display/read_brightness';
import { buildBrightnessStripContent } from './build_brightness_strip_content';
import { resolveStripTone } from './resolve_strip_tone';
import { StripPalette } from './strip_palette';
import { StripTones } from './strip_tones';
import { wrapDisplayStripSvg } from './wrap_display_strip_svg';

/**
 * The slice that the dial of one column draws of the idle panel: one slot per monitor, the primary first, each with its name,
 * brightness and bar, an HDR badge, and the word and the dimming that say it is off. A column without a monitor draws the plain background.
 * Without a snapshot (the monitors could not be read) every column draws a message, so no old value looks fresh.
 */
export function buildDisplayPanelSvg(
	snapshot: DisplaySnapshot | undefined,
	language: Language,
	column = 0
): string {
	if (snapshot === undefined) {
		return buildStripMessageSvg({
			message: displayMessages.text('snapshotUnavailable', language),
			color: StripPalette.primary,
			tone: StripTones.neutral,
			column,
		});
	}
	const tone = resolveStripTone(snapshot.monitors);
	const monitor = snapshot.monitors[column];
	if (monitor === undefined) {
		return wrapDisplayStripSvg({ tone, column, content: '' });
	}
	const brightness = readBrightness(monitor, 'auto');
	const isOff = monitor.power !== 'on';
	const hasBrightness = brightness !== undefined;
	const valueText = isOff
		? displayMessages.text('monitorOff', language)
		: hasBrightness
			? `${String(Math.round(brightness))} %`
			: displayMessages.text('notAdjustable', language);
	return wrapDisplayStripSvg({
		tone,
		column,
		content: buildBrightnessStripContent({
			title: monitor.name,
			valueText,
			isMessage: isOff || !hasBrightness,
			percent: brightness,
			isOff,
			hasHdr: monitor.hdr.isEnabled,
		}),
		isDimmed: isOff,
	});
}
