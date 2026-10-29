import { escapeXml } from 'deck-kit/text/escape_xml';

import { formatSvgNumber } from './format_svg_number';
import { NowPlayingMetrics } from './now_playing_metrics';

const HALF_DIVISOR = 2;

/** Draws a cover as a square image as wide as the whole touch strip, centered vertically, starting at `left` and dimmed to `opacity`. */
export function buildBackdropImage(
	options: Readonly<{ coverDataUrl: string; left: number; opacity: number }>
): string {
	const { stripWidth, stripHeight } = NowPlayingMetrics;
	const top = (stripHeight - stripWidth) / HALF_DIVISOR;
	return `<image x="${formatSvgNumber(options.left)}" y="${top}" width="${stripWidth}" height="${stripWidth}" preserveAspectRatio="xMidYMid slice" opacity="${options.opacity}" xlink:href="${escapeXml(options.coverDataUrl)}"/>`;
}
