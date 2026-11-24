import { buildStripText } from 'deck-kit/strip/build_strip_text';
import { fitStripText } from 'deck-kit/strip/fit_strip_text';

import type { ListenStripModel } from './listen_strip_model';
import { StripPalette } from './strip_palette';

const MARGIN = 12;
const CONTENT_WIDTH = 176;
const RIGHT_EDGE = MARGIN + CONTENT_WIDTH;
const TITLE_FONT_SIZE = 14;
const LEVEL_FONT_SIZE = 26;
const LEVEL_MAX_WIDTH = 98;
const STATE_FONT_SIZE = 13;
const STATE_MAX_WIDTH = 78;
const MESSAGE_FONT_SIZE = 22;
const BAR_Y = 76;
const BAR_HEIGHT = 8;
const BAR_TRACK_OPACITY = 0.25;
const OFF_BAR_OPACITY = 0.5;

function fit(text: string, fontSize: number, maxWidth: number): string {
	return fitStripText({ text, fontSize, isBold: true, maxWidth });
}

function buildBar(model: ListenStripModel): string {
	const track = `<rect x="${MARGIN}" y="${BAR_Y}" width="${CONTENT_WIDTH}" height="${BAR_HEIGHT}" rx="${BAR_HEIGHT / 2}" fill="#FFFFFF" fill-opacity="${BAR_TRACK_OPACITY}"/>`;
	if (!model.isAvailable || model.barFraction <= 0) {
		return track;
	}
	const width = Math.max(BAR_HEIGHT, CONTENT_WIDTH * model.barFraction);
	const color = model.isListening
		? StripPalette.accent
		: StripPalette.secondary;
	const opacity = model.isListening ? 1 : OFF_BAR_OPACITY;
	return `${track}<rect x="${MARGIN}" y="${BAR_Y}" width="${width}" height="${BAR_HEIGHT}" rx="${BAR_HEIGHT / 2}" fill="${color}" fill-opacity="${opacity}"/>`;
}

function buildValues(model: ListenStripModel): string {
	if (!model.isAvailable) {
		return buildStripText({
			text: fit(model.messageText, MESSAGE_FONT_SIZE, CONTENT_WIDTH),
			x: MARGIN,
			y: 62,
			fontSize: MESSAGE_FONT_SIZE,
			color: StripPalette.primary,
			isBold: true,
		});
	}
	return [
		buildStripText({
			text: fit(model.levelText, LEVEL_FONT_SIZE, LEVEL_MAX_WIDTH),
			x: MARGIN,
			y: 62,
			fontSize: LEVEL_FONT_SIZE,
			color: StripPalette.primary,
			isBold: true,
		}),
		buildStripText({
			text: fit(model.stateText, STATE_FONT_SIZE, STATE_MAX_WIDTH),
			x: RIGHT_EDGE,
			y: 62,
			fontSize: STATE_FONT_SIZE,
			color: model.isListening ? StripPalette.accent : StripPalette.secondary,
			anchor: 'end',
			isBold: true,
		}),
	].join('');
}

/** The content of a "Listen" strip: the input name fitted to the slot, the level large with the state in words on its right, and the bar of the level against the ceiling. */
export function buildListenStripContent(model: ListenStripModel): string {
	return [
		buildStripText({
			text: fit(model.title, TITLE_FONT_SIZE, CONTENT_WIDTH),
			x: MARGIN,
			y: 22,
			fontSize: TITLE_FONT_SIZE,
			color: StripPalette.secondary,
			isBold: true,
		}),
		buildValues(model),
		buildBar(model),
	].join('');
}
