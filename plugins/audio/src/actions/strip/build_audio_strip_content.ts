import { buildStripText } from 'deck-kit/strip/build_strip_text';
import { fitStripText } from 'deck-kit/strip/fit_strip_text';

import type { AudioStripModel } from './audio_strip_model';
import { StripPalette } from './strip_palette';

const MARGIN = 12;
const CONTENT_WIDTH = 176;
const TITLE_FONT_SIZE = 14;
const FIGURE_FONT_SIZE = 34;
const MESSAGE_FONT_SIZE = 22;
const BAR_Y = 76;
const BAR_HEIGHT = 8;
const BAR_TRACK_OPACITY = 0.25;
const MUTED_BAR_OPACITY = 0.4;

function buildBar(percent: number | undefined, isMuted: boolean): string {
	const track = `<rect x="${MARGIN}" y="${BAR_Y}" width="${CONTENT_WIDTH}" height="${BAR_HEIGHT}" rx="${BAR_HEIGHT / 2}" fill="#FFFFFF" fill-opacity="${BAR_TRACK_OPACITY}"/>`;
	if (percent === undefined || percent <= 0) {
		return track;
	}
	const width = Math.max(BAR_HEIGHT, (CONTENT_WIDTH * percent) / 100);
	const opacity = isMuted ? MUTED_BAR_OPACITY : 1;
	return `${track}<rect x="${MARGIN}" y="${BAR_Y}" width="${width}" height="${BAR_HEIGHT}" rx="${BAR_HEIGHT / 2}" fill="${StripPalette.accent}" fill-opacity="${opacity}"/>`;
}

/** The content of a strip slot for one device: its name fitted to the slot, the volume large or the word that says there is none or that it is muted, and the bar. */
export function buildAudioStripContent(model: AudioStripModel): string {
	const title = fitStripText({
		text: model.title,
		fontSize: TITLE_FONT_SIZE,
		isBold: true,
		maxWidth: CONTENT_WIDTH,
	});
	const fontSize = model.isMessage ? MESSAGE_FONT_SIZE : FIGURE_FONT_SIZE;
	const value = fitStripText({
		text: model.valueText,
		fontSize,
		isBold: true,
		maxWidth: CONTENT_WIDTH,
	});
	return [
		buildStripText({
			text: title,
			x: MARGIN,
			y: 22,
			fontSize: TITLE_FONT_SIZE,
			color: StripPalette.secondary,
			isBold: true,
		}),
		buildStripText({
			text: value,
			x: MARGIN,
			y: 62,
			fontSize,
			color: StripPalette.primary,
			isBold: true,
		}),
		buildBar(model.percent, model.isMuted),
	].join('');
}
