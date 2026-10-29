import { keyBackground } from 'deck-kit/keys/key_background';
import { escapeXml } from 'deck-kit/text/escape_xml';
import { estimateTextWidth } from 'deck-kit/text/estimate_text_width';
import { fitText } from 'deck-kit/text/fit_text';

import type { SpotifyDevice } from '../spotify/spotify_device';
import { deviceGlyph } from './device_glyph';

const KEY_SIZE = 144;
const ACTIVE_COLOR = '#1DB954';
const IDLE_COLOR = '#B3B3B3';
const GLYPH_BOX = 24;
const GLYPH_SCALE = 3.4;
const GLYPH_TOP = 14;
const LABEL_BASELINE = 130;
const LABEL_MAX_WIDTH = 128;
const LABEL_FONT_SIZES = [26, 24, 22, 20, 18] as const;
const LABEL_FONT_FAMILY = 'Segoe UI, Arial, sans-serif';

function fitsAt(text: string, fontSize: number): boolean {
	return estimateTextWidth({ text, fontSize, isBold: true }) <= LABEL_MAX_WIDTH;
}

function buildLabel(text: string, color: string): string {
	const fontSize =
		LABEL_FONT_SIZES.find((candidate) => fitsAt(text, candidate)) ??
		Math.min(...LABEL_FONT_SIZES);
	const fitted = fitText({
		text,
		fits: (candidate) => fitsAt(candidate, fontSize),
	});
	return `<text x="${KEY_SIZE / 2}" y="${LABEL_BASELINE}" fill="${color}" font-family="${LABEL_FONT_FAMILY}" font-size="${fontSize}" font-weight="bold" text-anchor="middle">${escapeXml(fitted)}</text>`;
}

/**
 * Draws a 144×144 "Play on device" key: the icon of the device kind with its label below, both green while the device plays and grey otherwise.
 * The label shrinks, then ends with an ellipsis, to fit the key.
 */
export function buildDeviceKeySvg(
	options: Readonly<{
		kind: SpotifyDevice['kind'];
		label: string;
		isActive: boolean;
	}>
): string {
	const color = options.isActive ? ACTIVE_COLOR : IDLE_COLOR;
	const glyphLeft = Math.round((KEY_SIZE - GLYPH_BOX * GLYPH_SCALE) / 2);
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${KEY_SIZE}" height="${KEY_SIZE}" viewBox="0 0 ${KEY_SIZE} ${KEY_SIZE}">`,
		`<rect width="${KEY_SIZE}" height="${KEY_SIZE}" fill="${keyBackground}"/>`,
		`<g transform="translate(${glyphLeft} ${GLYPH_TOP}) scale(${GLYPH_SCALE})">${deviceGlyph(options.kind, color)}</g>`,
		options.label === '' ? '' : buildLabel(options.label, color),
		'</svg>',
	].join('');
}
