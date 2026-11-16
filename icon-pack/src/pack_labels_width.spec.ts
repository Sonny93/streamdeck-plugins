import { Resvg } from '@resvg/resvg-js';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildKeySvg } from './build_key_svg.ts';
import { LABEL_FONT_FAMILY } from './label_font_family.ts';
import { PackIcons } from './pack_icons.ts';

const KEY_WIDTH = 144;
const MIN_SIDE_MARGIN = 8;
const BYTES_PER_PIXEL = 4;
const ALPHA_OFFSET = 3;
const BOLD_FONT_FILE = join(import.meta.dirname, '..', 'fonts', 'selawkb.ttf');
const BACKGROUND_RECT = /<rect[^>]*\/>/;

type InkSpan = Readonly<{ left: number; right: number }>;

function measureLabelInk(text: string): InkSpan {
	const svg = buildKeySvg({
		glyph: () => '',
		color: '#FFFFFF',
		label: { text, position: 'top' },
	}).replace(BACKGROUND_RECT, '');
	const rendered = new Resvg(svg, {
		fitTo: { mode: 'width', value: KEY_WIDTH },
		font: {
			loadSystemFonts: false,
			fontFiles: [BOLD_FONT_FILE],
			defaultFontFamily: LABEL_FONT_FAMILY,
		},
	}).render();
	const pixels = rendered.pixels;
	const inkColumns = Array.from(
		{ length: rendered.width },
		(_, column) => column
	).filter((column) =>
		Array.from({ length: rendered.height }, (_, row) => row).some(
			(row) =>
				(pixels[
					(row * rendered.width + column) * BYTES_PER_PIXEL + ALPHA_OFFSET
				] ?? 0) > 0
		)
	);
	return {
		left: inkColumns[0] ?? 0,
		right: inkColumns[inkColumns.length - 1] ?? 0,
	};
}

const LABELS = PackIcons.flatMap((icon) =>
	(['en', 'fr'] as const).map((language) => ({
		id: `${icon.id} (${language})`,
		text: icon.label[language],
	}))
);

describe('pack labels', () => {
	it.each(LABELS)(
		'should keep $id at least 8 px from both sides of the key',
		({ text }) => {
			const { left, right } = measureLabelInk(text);

			expect(left).toBeGreaterThanOrEqual(MIN_SIDE_MARGIN);
			expect(KEY_WIDTH - 1 - right).toBeGreaterThanOrEqual(MIN_SIDE_MARGIN);
		}
	);
});
