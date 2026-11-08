import { IconPalette } from './icon_palette.ts';
import type { KeyLabel } from './key_label.ts';
import { LABEL_FONT_FAMILY } from './label_font_family.ts';

const KEY_SIZE = 144;
const GLYPH_BOX = 24;
const LABEL_FONT_SIZE = 26;

/** A key without label: the icon fills the key like the images of the plugin manifests. */
const UNLABELED_LAYOUT = { glyphScale: 4, glyphTop: 24 } as const;

/** Same layout as the labeled keys of the plugins (`packages/deck-kit/src/keys/build_labeled_key_svg.ts`), so a pack key lines up with a plugin key. */
const LABELED_LAYOUTS = {
	top: { glyphScale: 3.4, glyphTop: 48, labelBaseline: 34 },
	bottom: { glyphScale: 3.4, glyphTop: 14, labelBaseline: 130 },
} as const;

function buildLabel(label: KeyLabel, color: string): string {
	return `<text x="${KEY_SIZE / 2}" y="${LABELED_LAYOUTS[label.position].labelBaseline}" fill="${color}" font-family="${LABEL_FONT_FAMILY}" font-size="${LABEL_FONT_SIZE}" font-weight="bold" text-anchor="middle">${label.text}</text>`;
}

/** Draws a 144×144 key: the icon in `color` and, when given, a label in the same color above or below it. */
export function buildKeySvg(
	options: Readonly<{
		glyph: (color: string) => string;
		color: string;
		label: KeyLabel | undefined;
	}>
): string {
	const { glyph, color, label } = options;
	const layout =
		label === undefined ? UNLABELED_LAYOUT : LABELED_LAYOUTS[label.position];
	const glyphLeft = Math.round((KEY_SIZE - GLYPH_BOX * layout.glyphScale) / 2);
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${KEY_SIZE}" height="${KEY_SIZE}" viewBox="0 0 ${KEY_SIZE} ${KEY_SIZE}">`,
		`<rect width="${KEY_SIZE}" height="${KEY_SIZE}" fill="${IconPalette.background}"/>`,
		`<g transform="translate(${glyphLeft} ${layout.glyphTop}) scale(${layout.glyphScale})">${glyph(color)}</g>`,
		label === undefined ? '' : buildLabel(label, color),
		'</svg>',
	].join('');
}
