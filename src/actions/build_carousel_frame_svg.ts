import { escapeXml } from './escape_xml';
import { truncateText } from './truncate_text';
import type { CarouselSlot } from './carousel_slot';
import { CarouselMetrics } from './carousel_metrics';
import { formatSvgNumber } from './format_svg_number';
import { buildCarouselHeart } from './build_carousel_heart';
import { resolveSlotGeometry } from './resolve_slot_geometry';
import { buildCarouselSlotSvg } from './build_carousel_slot_svg';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';
const HALF_DIVISOR = 2;

type CarouselFrameOptions = Readonly<{
	position: number;
	slots: readonly CarouselSlot[];
	title: string;
	positionLabel: string;
	isLikeTarget: boolean;
}>;

function buildSlots(slots: readonly CarouselSlot[]): string {
	return slots
		.map((slot, index) => ({ slot, id: String(index) }))
		.sort((a, b) => Math.abs(b.slot.offset) - Math.abs(a.slot.offset))
		.map(buildCarouselSlotSvg)
		.join('');
}

function buildLikeBadge(slots: readonly CarouselSlot[]): string {
	const centered = slots.reduce<CarouselSlot | undefined>(
		(nearest, slot) =>
			nearest === undefined || Math.abs(slot.offset) < Math.abs(nearest.offset)
				? slot
				: nearest,
		undefined
	);
	if (centered === undefined) {
		return '';
	}
	const geometry = resolveSlotGeometry(centered.offset);
	const { badge } = CarouselMetrics;
	const centerX = geometry.left + geometry.size - badge.inset;
	const centerY = geometry.top + badge.inset;
	const heart = buildCarouselHeart({
		x: centerX - badge.heartSize / HALF_DIVISOR,
		y: centerY - badge.heartSize / HALF_DIVISOR,
		size: badge.heartSize,
		fill: badge.heartColor,
	});
	return `<g opacity="${formatSvgNumber(geometry.opacity)}"><circle cx="${formatSvgNumber(centerX)}" cy="${formatSvgNumber(centerY)}" r="${badge.radius}" fill="${badge.backdropColor}" fill-opacity="${badge.backdropOpacity}"/>${heart}</g>`;
}

function buildTitle(title: string): string {
	const style = CarouselMetrics.title;
	const text = escapeXml(
		truncateText({ text: title, maxLength: style.maxLength })
	);
	return `<text x="${CarouselMetrics.stripWidth / HALF_DIVISOR}" y="${style.y}" text-anchor="middle" font-family="${CarouselMetrics.fontFamily}" font-size="${style.fontSize}" font-weight="${style.fontWeight}" fill="${style.color}">${text}</text>`;
}

function buildPositionLabel(positionLabel: string): string {
	if (positionLabel === '') {
		return '';
	}
	const style = CarouselMetrics.position;
	return `<text x="${style.x}" y="${style.y}" text-anchor="end" font-family="${CarouselMetrics.fontFamily}" font-size="${style.fontSize}" fill="${style.color}">${escapeXml(positionLabel)}</text>`;
}

/**
 * Draws one frame of the carousel of the "Playlists" dial as a 200x100 SVG document on a black background.
 * The covers are drawn from the farthest to the nearest to the center, then the title (truncated), the position label and,
 * when the shown playlist is the like target, a heart badge on the corner of the cover nearest to the center.
 */
export function buildCarouselFrameSvg(options: CarouselFrameOptions): string {
	const { stripWidth, stripHeight, background } = CarouselMetrics;
	const badge = options.isLikeTarget ? buildLikeBadge(options.slots) : '';
	return `<svg xmlns="${SVG_NAMESPACE}" xmlns:xlink="${XLINK_NAMESPACE}" width="${stripWidth}" height="${stripHeight}" viewBox="0 0 ${stripWidth} ${stripHeight}"><rect width="${stripWidth}" height="${stripHeight}" fill="${background}"/>${buildSlots(options.slots)}${badge}${buildTitle(options.title)}${buildPositionLabel(options.positionLabel)}</svg>`;
}
