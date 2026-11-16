import { StripPanel } from 'deck-kit/strip/strip_panel';
import { escapeXml } from 'deck-kit/text/escape_xml';

import { formatSvgNumber } from './format_svg_number';

const HALF_DIVISOR = 2;

/** Draws a cover as a square image as wide as the whole touch strip, centered vertically, starting at `left` and dimmed to `opacity`. */
export function buildBackdropImage(
	options: Readonly<{ coverDataUrl: string; left: number; opacity: number }>
): string {
	const { width, height } = StripPanel;
	const top = (height - width) / HALF_DIVISOR;
	return `<image x="${formatSvgNumber(options.left)}" y="${top}" width="${width}" height="${width}" preserveAspectRatio="xMidYMid slice" opacity="${options.opacity}" xlink:href="${escapeXml(options.coverDataUrl)}"/>`;
}
