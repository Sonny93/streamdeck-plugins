import { wrapStripSvg } from 'deck-kit/strip/wrap_strip_svg';

import type { StripTone } from './strip_tone';
import { StripTones } from './strip_tones';

/** Puts the content of a strip over its slice (`column`, the first by default) of the background of a climate tone, dimmed when asked. */
export function wrapClimateStripSvg(
	options: Readonly<{
		tone: StripTone;
		column?: number;
		content: string;
		isDimmed?: boolean;
	}>
): string {
	return wrapStripSvg({
		tone: StripTones[options.tone],
		column: options.column,
		content: options.content,
		isDimmed: options.isDimmed,
	});
}
