import { buildStripBackground } from './build_strip_background';
import type { StripBackgroundTone } from './strip_background_tone';

/** The opacity of the content of a strip that is dimmed, e.g. while what it shows is off. */
export const DIMMED_OPACITY = 0.7;

/** Puts the content of a strip over its slice (`column`, the first by default) of the background of a tone, dimmed when asked, as a 200 by 100 picture. */
export function wrapStripSvg(
	options: Readonly<{
		tone: StripBackgroundTone;
		column?: number;
		content: string;
		isDimmed?: boolean;
	}>
): string {
	const opacity = options.isDimmed === true ? DIMMED_OPACITY : 1;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">${buildStripBackground(options.tone, options.column)}<g opacity="${opacity}">${options.content}</g></svg>`;
}
