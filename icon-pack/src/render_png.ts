import { Resvg } from '@resvg/resvg-js';
import { join } from 'node:path';

import { LABEL_FONT_FAMILY } from './label_font_family.ts';

const BOLD_FONT_FILE = join(import.meta.dirname, '..', 'fonts', 'selawkb.ttf');

/** Renders an SVG to a PNG `width` pixels wide, with only the bundled Selawik Bold font so the labels look the same on every OS. */
export function renderPng(
	options: Readonly<{ svg: string; width: number }>
): Buffer {
	return new Resvg(options.svg, {
		fitTo: { mode: 'width', value: options.width },
		font: {
			loadSystemFonts: false,
			fontFiles: [BOLD_FONT_FILE],
			defaultFontFamily: LABEL_FONT_FAMILY,
		},
	})
		.render()
		.asPng();
}
