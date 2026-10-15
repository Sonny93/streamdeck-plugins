import { escapeXml } from './escape_xml';
import { truncateText } from './truncate_text';
import { formatTrackTime } from './format_track_time';
import { formatSvgNumber } from './format_svg_number';
import { NowPlayingMetrics } from './now_playing_metrics';
import type { NowPlayingFrame } from './now_playing_frame';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';
const COVER_CLIP_ID = 'now-playing-cover';
const HALF_DIVISOR = 2;

type TextStyle = Readonly<{
	y: number;
	fontSize: number;
	color: string;
	fontWeight?: number;
}>;

type TextPlacement = Readonly<{ x: number; anchor: 'start' | 'end' }>;

const START_PLACEMENT: TextPlacement = {
	x: NowPlayingMetrics.textX,
	anchor: 'start',
};

function buildBackdrop(coverDataUrl: string | undefined): string {
	if (coverDataUrl === undefined) {
		return '';
	}
	const { stripWidth, stripHeight, backdropOpacity } = NowPlayingMetrics;
	const top = (stripHeight - stripWidth) / HALF_DIVISOR;
	return `<image x="0" y="${top}" width="${stripWidth}" height="${stripWidth}" preserveAspectRatio="xMidYMid slice" opacity="${backdropOpacity}" xlink:href="${escapeXml(coverDataUrl)}"/>`;
}

function isCoverInSlice(sliceLeft: number): boolean {
	const { cover, segmentWidth } = NowPlayingMetrics;
	return sliceLeft < cover.x + cover.size && sliceLeft + segmentWidth > cover.x;
}

function buildCover(coverDataUrl: string | undefined): string {
	const { x, y, size, cornerRadius, fallbackColor } = NowPlayingMetrics.cover;
	if (coverDataUrl === undefined) {
		return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${cornerRadius}" fill="${fallbackColor}"/>`;
	}
	return [
		`<clipPath id="${COVER_CLIP_ID}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${cornerRadius}"/></clipPath>`,
		`<image x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${COVER_CLIP_ID})" xlink:href="${escapeXml(coverDataUrl)}"/>`,
	].join('');
}

function buildPauseBar(x: number, top: number): string {
	const { barWidth, barHeight, color } = NowPlayingMetrics.pauseBadge;
	return `<rect x="${formatSvgNumber(x)}" y="${formatSvgNumber(top)}" width="${barWidth}" height="${barHeight}" fill="${color}"/>`;
}

function buildPauseBadge(): string {
	const { cover, pauseBadge } = NowPlayingMetrics;
	const centerX = cover.x + cover.size / HALF_DIVISOR;
	const centerY = cover.y + cover.size / HALF_DIVISOR;
	const barTop = centerY - pauseBadge.barHeight / HALF_DIVISOR;
	const halfGap = pauseBadge.barGap / HALF_DIVISOR;
	return [
		`<circle cx="${centerX}" cy="${centerY}" r="${pauseBadge.radius}" fill="${pauseBadge.backdropColor}" fill-opacity="${pauseBadge.backdropOpacity}"/>`,
		buildPauseBar(centerX - halfGap - pauseBadge.barWidth, barTop),
		buildPauseBar(centerX + halfGap, barTop),
	].join('');
}

function buildText(
	text: string,
	style: TextStyle,
	placement: TextPlacement = START_PLACEMENT
): string {
	if (text === '') {
		return '';
	}
	const weight =
		style.fontWeight === undefined ? '' : ` font-weight="${style.fontWeight}"`;
	return `<text x="${placement.x}" y="${style.y}" text-anchor="${placement.anchor}" font-family="${NowPlayingMetrics.fontFamily}" font-size="${style.fontSize}"${weight} fill="${style.color}">${escapeXml(text)}</text>`;
}

function buildTimes(frame: NowPlayingFrame): string {
	const { time } = NowPlayingMetrics;
	const elapsed = buildText(formatTrackTime(frame.positionMilliseconds), time, {
		x: time.elapsedRight,
		anchor: 'end',
	});
	if (frame.durationMilliseconds <= 0) {
		return elapsed;
	}
	const total = buildText(formatTrackTime(frame.durationMilliseconds), time, {
		x: time.totalLeft,
		anchor: 'start',
	});
	return `${elapsed}${total}`;
}

function resolveProgressRatio(frame: NowPlayingFrame): number {
	if (frame.durationMilliseconds <= 0) {
		return 0;
	}
	const ratio = frame.positionMilliseconds / frame.durationMilliseconds;
	return Math.min(1, Math.max(0, ratio));
}

function buildProgressBar(frame: NowPlayingFrame): string {
	const { x, y, width, height, trackColor, trackOpacity } =
		NowPlayingMetrics.progress;
	const radius = height / HALF_DIVISOR;
	const background = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${trackColor}" fill-opacity="${trackOpacity}"/>`;
	const ratio = resolveProgressRatio(frame);
	if (ratio === 0) {
		return background;
	}
	const { playingColor, pausedColor } = NowPlayingMetrics.progress;
	const filledWidth = formatSvgNumber(Math.max(height, width * ratio));
	const fill = frame.isPaused ? pausedColor : playingColor;
	return `${background}<rect x="${x}" y="${y}" width="${filledWidth}" height="${height}" rx="${radius}" fill="${fill}"/>`;
}

/**
 * Draws one dial's 200x100 slice, starting at `sliceLeft`, of the "now playing" screen laid out over the whole 800x100 touch strip:
 * the cover, dimmed and stretched, as the backdrop, the cover itself (with a pause badge while paused), the title and artists (truncated),
 * the times and a progress bar. The cover is only embedded in the slices it overlaps; without cover, the backdrop stays black.
 */
export function buildNowPlayingSvg(
	options: Readonly<{ frame: NowPlayingFrame; sliceLeft: number }>
): string {
	const { frame, sliceLeft } = options;
	const { stripWidth, stripHeight, segmentWidth, background } =
		NowPlayingMetrics;
	const { title, artists } = NowPlayingMetrics;
	const artistLine = frame.artistNames.join(artists.separator);
	const showsCover = isCoverInSlice(sliceLeft);
	return [
		`<svg xmlns="${SVG_NAMESPACE}" xmlns:xlink="${XLINK_NAMESPACE}" width="${segmentWidth}" height="${stripHeight}" viewBox="${sliceLeft} 0 ${segmentWidth} ${stripHeight}">`,
		`<rect width="${stripWidth}" height="${stripHeight}" fill="${background}"/>`,
		buildBackdrop(frame.coverDataUrl),
		showsCover ? buildCover(frame.coverDataUrl) : '',
		showsCover && frame.isPaused ? buildPauseBadge() : '',
		buildText(
			truncateText({ text: frame.title, maxLength: title.maxLength }),
			title
		),
		buildText(
			truncateText({ text: artistLine, maxLength: artists.maxLength }),
			artists
		),
		buildProgressBar(frame),
		buildTimes(frame),
		'</svg>',
	].join('');
}
