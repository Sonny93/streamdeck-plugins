import { KeyPalette } from './key_palette';
import type { KeyLabel } from './key_label';
import { fitText } from '../../shared/fit_text';
import { escapeXml } from '../../shared/escape_xml';
import { estimateTextWidth } from '../../shared/estimate_text_width';

const KEY_SIZE = 144;
const GLYPH_BOX = 24;
const LABEL_MAX_WIDTH = 128;
const LABEL_FONT_SIZES = [26, 24, 22, 20, 18] as const;
const LABEL_FONT_FAMILY = 'Segoe UI, Arial, sans-serif';

/** Where the icon and the text go: the icon shrinks to leave a band for the text above or below it. */
const LAYOUTS = {
	top: { glyphScale: 3.4, glyphTop: 48, labelBaseline: 34 },
	bottom: { glyphScale: 3.4, glyphTop: 14, labelBaseline: 130 },
} as const;

function pickFontSize(text: string): number {
	return (
		LABEL_FONT_SIZES.find(
			(fontSize) =>
				estimateTextWidth({ text, fontSize, isBold: true }) <= LABEL_MAX_WIDTH
		) ?? Math.min(...LABEL_FONT_SIZES)
	);
}

function buildLabel(label: KeyLabel, color: string): string {
	const fontSize = pickFontSize(label.text);
	const text = fitText({
		text: label.text,
		fits: (candidate) =>
			estimateTextWidth({ text: candidate, fontSize, isBold: true }) <=
			LABEL_MAX_WIDTH,
	});
	return `<text x="${KEY_SIZE / 2}" y="${LAYOUTS[label.position].labelBaseline}" fill="${color}" font-family="${LABEL_FONT_FAMILY}" font-size="${fontSize}" font-weight="bold" text-anchor="middle">${escapeXml(text)}</text>`;
}

/** Draws a 144×144 key: the icon in the color of the key state and, when given, a label in the same color above or below it. */
export function buildLabeledKeySvg(
	options: Readonly<{
		glyph: (color: string) => string;
		color: string;
		label: KeyLabel;
	}>
): string {
	const { glyph, color, label } = options;
	const layout = LAYOUTS[label.position];
	const glyphLeft = Math.round((KEY_SIZE - GLYPH_BOX * layout.glyphScale) / 2);
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${KEY_SIZE}" height="${KEY_SIZE}" viewBox="0 0 ${KEY_SIZE} ${KEY_SIZE}">`,
		`<rect width="${KEY_SIZE}" height="${KEY_SIZE}" fill="${KeyPalette.background}"/>`,
		`<g transform="translate(${glyphLeft} ${layout.glyphTop}) scale(${layout.glyphScale})">${glyph(color)}</g>`,
		buildLabel(label, color),
		'</svg>',
	].join('');
}
