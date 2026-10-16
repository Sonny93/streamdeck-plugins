import { fitText } from './fit_text';
import { wrapText } from './wrap_text';
import { escapeXml } from './escape_xml';
import { truncateText } from './truncate_text';
import { formatTrackTime } from './format_track_time';
import { formatSvgNumber } from './format_svg_number';
import { NowPlayingMetrics } from './now_playing_metrics';
import { estimateTextWidth } from './estimate_text_width';
import type { NowPlayingFrame } from './now_playing_frame';
import { buildBackdropImage } from './build_backdrop_image';
import type { NowPlayingLyrics } from './now_playing_lyrics';
import type { NowPlayingLyricsTransition } from './now_playing_lyrics_transition';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';
const COVER_CLIP_ID = 'now-playing-cover';
const INFO_CLIP_ID = 'now-playing-info';
const LYRICS_CLIP_ID = 'now-playing-lyrics';
const HALF_DIVISOR = 2;

type TextStyle = Readonly<{
	y: number;
	fontSize: number;
	color: string;
	fontWeight?: number;
}>;

type TextPlacement = Readonly<{
	x: number;
	anchor: 'start' | 'middle' | 'end';
}>;

type LyricsStyle = Omit<TextStyle, 'y'> & Readonly<{ lineHeight: number }>;

type LyricsRow = Readonly<{ text: string; style: LyricsStyle }>;

const START_PLACEMENT: TextPlacement = {
	x: NowPlayingMetrics.textX,
	anchor: 'start',
};

function buildBackdrop(coverDataUrl: string | undefined): string {
	if (coverDataUrl === undefined) {
		return '';
	}
	return buildBackdropImage({
		coverDataUrl,
		left: 0,
		opacity: NowPlayingMetrics.backdropOpacity,
	});
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
		`<defs><clipPath id="${COVER_CLIP_ID}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${cornerRadius}"/></clipPath></defs>`,
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
	return `<text x="${formatSvgNumber(placement.x)}" y="${formatSvgNumber(style.y)}" text-anchor="${placement.anchor}" font-family="${NowPlayingMetrics.fontFamily}" font-size="${style.fontSize}"${weight} fill="${style.color}">${escapeXml(text)}</text>`;
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

function buildClip(id: string, left: number, right: number): string {
	return `<defs><clipPath id="${id}"><rect x="${left}" y="0" width="${right - left}" height="${NowPlayingMetrics.stripHeight}"/></clipPath></defs>`;
}

function buildTrackInfo(frame: NowPlayingFrame): string {
	const { title, artists, splitTitle, splitArtists, infoClipRight } =
		NowPlayingMetrics;
	const artistLine = frame.artistNames.join(artists.separator);
	const isSplit = frame.lyrics !== undefined;
	const titleStyle = isSplit ? splitTitle : title;
	const artistsStyle = isSplit ? splitArtists : artists;
	const texts = [
		buildText(
			truncateText({ text: frame.title, maxLength: titleStyle.maxLength }),
			titleStyle
		),
		buildText(
			truncateText({ text: artistLine, maxLength: artistsStyle.maxLength }),
			artistsStyle
		),
	].join('');
	if (!isSplit) {
		return texts;
	}
	return `${buildClip(INFO_CLIP_ID, 0, infoClipRight)}<g clip-path="url(#${INFO_CLIP_ID})">${texts}</g>`;
}

function fitsLyricsRow(style: LyricsStyle): (text: string) => boolean {
	return (text) =>
		estimateTextWidth({
			text,
			fontSize: style.fontSize,
			isBold: style.fontWeight !== undefined,
		}) <= NowPlayingMetrics.lyrics.textWidth;
}

function buildLyricsRows(lyrics: NowPlayingLyrics): LyricsRow[] {
	const { current, next } = NowPlayingMetrics.lyrics;
	const currentRows = wrapText({
		text: lyrics.current,
		maxRows: current.maxRows,
		fits: fitsLyricsRow(current),
	}).map((text) => ({ text, style: current }));
	if (lyrics.next === undefined) {
		return currentRows;
	}
	return [
		...currentRows,
		{
			text: fitText({ text: lyrics.next, fits: fitsLyricsRow(next) }),
			style: next,
		},
	];
}

function buildLyricsBlock(lyrics: NowPlayingLyrics): string {
	const { centerX, areaTop, areaBottom, baselineRatio } =
		NowPlayingMetrics.lyrics;
	const rows = buildLyricsRows(lyrics);
	const blockHeight = rows.reduce(
		(total, row) => total + row.style.lineHeight,
		0
	);
	let rowTop = areaTop + (areaBottom - areaTop - blockHeight) / HALF_DIVISOR;
	return rows
		.map((row) => {
			const y = rowTop + row.style.lineHeight * baselineRatio;
			rowTop += row.style.lineHeight;
			return buildText(
				row.text,
				{ ...row.style, y },
				{ x: centerX, anchor: 'middle' }
			);
		})
		.join('');
}

function buildMovingBlock(
	lyrics: NowPlayingLyrics,
	options: Readonly<{ shift: number; opacity: number }>
): string {
	return `<g transform="translate(0,${formatSvgNumber(options.shift)})" opacity="${formatSvgNumber(options.opacity)}">${buildLyricsBlock(lyrics)}</g>`;
}

function buildLyricsContent(
	lyrics: NowPlayingLyrics,
	transition: NowPlayingLyricsTransition | undefined
): string {
	if (transition === undefined) {
		return buildLyricsBlock(lyrics);
	}
	const { progress, previous } = transition;
	const { transitionShift } = NowPlayingMetrics.lyrics;
	return [
		buildMovingBlock(previous, {
			shift: -transitionShift * progress,
			opacity: 1 - progress,
		}),
		buildMovingBlock(lyrics, {
			shift: transitionShift * (1 - progress),
			opacity: progress,
		}),
	].join('');
}

function buildLyrics(frame: NowPlayingFrame): string {
	if (frame.lyrics === undefined) {
		return '';
	}
	const { left, right } = NowPlayingMetrics.lyrics;
	return `${buildClip(LYRICS_CLIP_ID, left, right)}<g clip-path="url(#${LYRICS_CLIP_ID})">${buildLyricsContent(frame.lyrics, frame.lyricsTransition)}</g>`;
}

/**
 * Draws one dial's 200x100 slice, starting at `sliceLeft`, of the "now playing" screen laid out over the whole 800x100 touch strip:
 * the cover, dimmed and stretched, as the backdrop, the cover itself (with a pause badge while paused), the title and artists (truncated),
 * the times and a progress bar. The cover is only embedded in the slices it overlaps; without cover, the backdrop stays black.
 * With lyrics, the title and artists keep to the left half and the right half shows the line being sung (on up to two rows) and the next one;
 * during a change of line, the previous lines slide up and fade out while the new ones slide in from below.
 */
export function buildNowPlayingSvg(
	options: Readonly<{ frame: NowPlayingFrame; sliceLeft: number }>
): string {
	const { frame, sliceLeft } = options;
	const { stripWidth, stripHeight, segmentWidth, background } =
		NowPlayingMetrics;
	const showsCover = isCoverInSlice(sliceLeft);
	return [
		`<svg xmlns="${SVG_NAMESPACE}" xmlns:xlink="${XLINK_NAMESPACE}" width="${segmentWidth}" height="${stripHeight}" viewBox="${sliceLeft} 0 ${segmentWidth} ${stripHeight}">`,
		`<rect width="${stripWidth}" height="${stripHeight}" fill="${background}"/>`,
		buildBackdrop(frame.coverDataUrl),
		showsCover ? buildCover(frame.coverDataUrl) : '',
		showsCover && frame.isPaused ? buildPauseBadge() : '',
		buildTrackInfo(frame),
		buildLyrics(frame),
		buildProgressBar(frame),
		buildTimes(frame),
		'</svg>',
	].join('');
}
