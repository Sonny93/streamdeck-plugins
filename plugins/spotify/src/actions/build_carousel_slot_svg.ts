import { escapeXml } from './escape_xml';
import type { CarouselSlot } from './carousel_slot';
import type { SlotGeometry } from './slot_geometry';
import { CarouselMetrics } from './carousel_metrics';
import { formatSvgNumber } from './format_svg_number';
import { buildCarouselHeart } from './build_carousel_heart';
import { resolveSlotGeometry } from './resolve_slot_geometry';

const QUARTER_DIVISOR = 4;
const HALF_DIVISOR = 2;

function buildRoundedRect(geometry: SlotGeometry, fill: string): string {
	return `<rect x="${formatSvgNumber(geometry.left)}" y="${formatSvgNumber(geometry.top)}" width="${formatSvgNumber(geometry.size)}" height="${formatSvgNumber(geometry.size)}" rx="${CarouselMetrics.coverCornerRadius}" fill="${fill}"/>`;
}

function buildFallbackCover(geometry: SlotGeometry, id: string): string {
	const gradientId = `gradient-${id}`;
	const { fallback } = CarouselMetrics;
	const heartSize = geometry.size / HALF_DIVISOR;
	return [
		`<linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${fallback.startColor}"/><stop offset="1" stop-color="${fallback.endColor}"/></linearGradient>`,
		buildRoundedRect(geometry, `url(#${gradientId})`),
		buildCarouselHeart({
			x: geometry.left + geometry.size / QUARTER_DIVISOR,
			y: geometry.top + geometry.size / QUARTER_DIVISOR,
			size: heartSize,
			fill: fallback.heartColor,
		}),
	].join('');
}

function buildImageCover(
	geometry: SlotGeometry,
	options: Readonly<{ id: string; coverDataUrl: string }>
): string {
	const clipId = `clip-${options.id}`;
	const href = escapeXml(options.coverDataUrl);
	const x = formatSvgNumber(geometry.left);
	const y = formatSvgNumber(geometry.top);
	const size = formatSvgNumber(geometry.size);
	return [
		`<defs><clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${CarouselMetrics.coverCornerRadius}"/></clipPath></defs>`,
		`<image x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" xlink:href="${href}"/>`,
	].join('');
}

/**
 * Draws one cover of the carousel as an SVG group; `id` keeps the clip and gradient ids unique inside a frame.
 * A slot without cover is drawn as the Liked Songs look (gradient square and white heart) directly in SVG shapes.
 * Returns an empty string when the cover lies entirely outside the strip.
 */
export function buildCarouselSlotSvg(
	options: Readonly<{ slot: CarouselSlot; id: string }>
): string {
	const geometry = resolveSlotGeometry(options.slot.offset);
	if (
		geometry.left >= CarouselMetrics.stripWidth ||
		geometry.left + geometry.size <= 0
	) {
		return '';
	}
	const { coverDataUrl } = options.slot;
	const cover =
		coverDataUrl === undefined
			? buildFallbackCover(geometry, options.id)
			: buildImageCover(geometry, { id: options.id, coverDataUrl });
	return `<g opacity="${formatSvgNumber(geometry.opacity)}">${cover}</g>`;
}
