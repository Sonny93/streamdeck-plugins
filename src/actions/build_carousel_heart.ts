import { formatSvgNumber } from './format_svg_number';

const HEART_PATH =
	'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
const HEART_VIEW_BOX_SIZE = 24;

/** Draws the heart icon of the plugin as an SVG path whose bounding box starts at `(x, y)` and is `size` wide. */
export function buildCarouselHeart(
	options: Readonly<{ x: number; y: number; size: number; fill: string }>
): string {
	const scale = options.size / HEART_VIEW_BOX_SIZE;
	return `<path transform="translate(${formatSvgNumber(options.x)} ${formatSvgNumber(options.y)}) scale(${formatSvgNumber(scale)})" d="${HEART_PATH}" fill="${options.fill}"/>`;
}
