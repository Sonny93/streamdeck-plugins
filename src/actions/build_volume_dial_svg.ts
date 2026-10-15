import { escapeXml } from './escape_xml';
import { truncateText } from './truncate_text';
import { formatSvgNumber } from './format_svg_number';
import type { VolumeReading } from './volume_reading';
import { VolumeDialMetrics } from './volume_dial_metrics';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const HALF_DIVISOR = 2;
const PERCENT = 100;
const MUTED_LABEL = 'Muted';
const NO_LEVEL_LABEL = '–';
const SILENT_NOTE = 'Not playing sound';
const MUTED_NOTE = 'Press to unmute';

type TextOptions = Readonly<{
	x: number;
	anchor: 'start' | 'end';
	style: Readonly<{
		y: number;
		fontSize: number;
		color: string;
		fontWeight?: number;
	}>;
	color?: string;
}>;

function buildText(text: string, options: TextOptions): string {
	const { style } = options;
	const weight =
		style.fontWeight === undefined ? '' : ` font-weight="${style.fontWeight}"`;
	return `<text x="${options.x}" y="${style.y}" text-anchor="${options.anchor}" font-family="${VolumeDialMetrics.fontFamily}" font-size="${style.fontSize}"${weight} fill="${options.color ?? style.color}">${escapeXml(text)}</text>`;
}

function formatLevel(reading: VolumeReading): string {
	if (reading.volume === undefined) {
		return NO_LEVEL_LABEL;
	}
	return reading.isMuted
		? MUTED_LABEL
		: `${Math.round(reading.volume * PERCENT)}%`;
}

function buildBar(reading: VolumeReading): string {
	const { left, right, bar } = VolumeDialMetrics;
	const width = right - left;
	const radius = bar.height / HALF_DIVISOR;
	const track = `<rect x="${left}" y="${bar.y}" width="${width}" height="${bar.height}" rx="${radius}" fill="${bar.trackColor}" fill-opacity="${bar.trackOpacity}"/>`;
	const volume = reading.volume ?? 0;
	if (volume <= 0) {
		return track;
	}
	const filledWidth = formatSvgNumber(Math.max(bar.height, width * volume));
	const color = reading.isMuted ? bar.mutedColor : bar.color;
	return `${track}<rect x="${left}" y="${bar.y}" width="${filledWidth}" height="${bar.height}" rx="${radius}" fill="${color}"/>`;
}

function readNote(reading: VolumeReading): string | undefined {
	if (reading.volume === undefined) {
		return SILENT_NOTE;
	}
	return reading.isMuted ? MUTED_NOTE : undefined;
}

/**
 * Draws a "Volume" dial as a 200x100 SVG document: what it controls, the app name (truncated), the volume in percent and a level bar.
 * A muted app shows "Muted" and a grey bar; an app that plays no sound shows a dash and an empty bar.
 */
export function buildVolumeDialSvg(reading: VolumeReading): string {
	const { stripWidth, stripHeight, background, left, right } =
		VolumeDialMetrics;
	const note = readNote(reading);
	return [
		`<svg xmlns="${SVG_NAMESPACE}" width="${stripWidth}" height="${stripHeight}" viewBox="0 0 ${stripWidth} ${stripHeight}">`,
		`<rect width="${stripWidth}" height="${stripHeight}" fill="${background}"/>`,
		buildText(reading.caption, {
			x: left,
			anchor: 'start',
			style: VolumeDialMetrics.caption,
		}),
		buildText(
			truncateText({
				text: reading.name,
				maxLength: VolumeDialMetrics.name.maxLength,
			}),
			{ x: left, anchor: 'start', style: VolumeDialMetrics.name }
		),
		buildText(formatLevel(reading), {
			x: right,
			anchor: 'end',
			style: VolumeDialMetrics.level,
			color:
				reading.isMuted || reading.volume === undefined
					? VolumeDialMetrics.level.mutedColor
					: undefined,
		}),
		buildBar(reading),
		note === undefined
			? ''
			: buildText(note, {
					x: left,
					anchor: 'start',
					style: VolumeDialMetrics.note,
				}),
		'</svg>',
	].join('');
}
