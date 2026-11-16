import { buildStripText } from 'deck-kit/strip/build_strip_text';
import { fitStripText } from 'deck-kit/strip/fit_strip_text';

import type { BrightnessStripModel } from './brightness_strip_model';
import { StripPalette } from './strip_palette';

const MARGIN = 12;
const CONTENT_WIDTH = 176;
const BADGE_WIDTH = 38;
const BADGE_GAP = 6;
const TITLE_FONT_SIZE = 14;
const FIGURE_FONT_SIZE = 34;
const MESSAGE_FONT_SIZE = 22;
const BAR_Y = 76;
const BAR_HEIGHT = 8;
const BAR_TRACK_OPACITY = 0.25;
const OFF_BAR_OPACITY = 0.4;

function buildBadge(color: string): string {
	const left = MARGIN + CONTENT_WIDTH - BADGE_WIDTH;
	const center = left + BADGE_WIDTH / 2;
	return `<rect x="${left}" y="8" width="${BADGE_WIDTH}" height="18" rx="4" fill="none" stroke="${color}" stroke-width="1.5"/>${buildStripText({ text: 'HDR', x: center, y: 21, fontSize: 11, color, anchor: 'middle', isBold: true })}`;
}

function buildBar(percent: number | undefined, isOff: boolean): string {
	const track = `<rect x="${MARGIN}" y="${BAR_Y}" width="${CONTENT_WIDTH}" height="${BAR_HEIGHT}" rx="${BAR_HEIGHT / 2}" fill="#FFFFFF" fill-opacity="${BAR_TRACK_OPACITY}"/>`;
	if (percent === undefined || percent <= 0) {
		return track;
	}
	const width = Math.max(BAR_HEIGHT, (CONTENT_WIDTH * percent) / 100);
	const opacity = isOff ? OFF_BAR_OPACITY : 1;
	return `${track}<rect x="${MARGIN}" y="${BAR_Y}" width="${width}" height="${BAR_HEIGHT}" rx="${BAR_HEIGHT / 2}" fill="${StripPalette.accent}" fill-opacity="${opacity}"/>`;
}

/**
 * The content of a strip slot for one monitor or one group: its name (fitted to the room the HDR badge leaves),
 * the brightness large or the word that says there is none or that it is off, and the bar.
 */
export function buildBrightnessStripContent(
	model: BrightnessStripModel
): string {
	const titleWidth =
		CONTENT_WIDTH - (model.hasHdr ? BADGE_WIDTH + BADGE_GAP : 0);
	const title = fitStripText({
		text: model.title,
		fontSize: TITLE_FONT_SIZE,
		isBold: true,
		maxWidth: titleWidth,
	});
	const fontSize = model.isMessage ? MESSAGE_FONT_SIZE : FIGURE_FONT_SIZE;
	const value = fitStripText({
		text: model.valueText,
		fontSize,
		isBold: true,
		maxWidth: CONTENT_WIDTH,
	});
	const badgeColor = model.isOff ? StripPalette.secondary : StripPalette.accent;
	return [
		buildStripText({
			text: title,
			x: MARGIN,
			y: 22,
			fontSize: TITLE_FONT_SIZE,
			color: StripPalette.secondary,
			isBold: true,
		}),
		model.hasHdr ? buildBadge(badgeColor) : '',
		buildStripText({
			text: value,
			x: MARGIN,
			y: 62,
			fontSize,
			color: StripPalette.primary,
			isBold: true,
		}),
		buildBar(model.percent, model.isOff),
	].join('');
}
