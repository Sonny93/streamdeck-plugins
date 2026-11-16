import { buildStripText } from './build_strip_text';
import type { StripBackgroundTone } from './strip_background_tone';
import { wrapStripSvg } from './wrap_strip_svg';

const CENTER_X = 100;
const BASELINE_Y = 58;
const FONT_SIZE = 22;

/** A strip that only shows one centered message, over its slice (`column`, the first by default) of the background of a tone. */
export function buildStripMessageSvg(
	options: Readonly<{
		message: string;
		color: string;
		tone: StripBackgroundTone;
		column?: number;
	}>
): string {
	return wrapStripSvg({
		tone: options.tone,
		column: options.column,
		content: buildStripText({
			text: options.message,
			x: CENTER_X,
			y: BASELINE_Y,
			fontSize: FONT_SIZE,
			color: options.color,
			anchor: 'middle',
		}),
	});
}
