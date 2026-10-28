import { Resvg } from '@resvg/resvg-js';

/** Renders an SVG to a PNG `width` pixels wide, with the system fonts so the labels use Segoe UI like Stream Deck. */
export function renderPng(
	options: Readonly<{ svg: string; width: number }>
): Buffer {
	return new Resvg(options.svg, {
		fitTo: { mode: 'width', value: options.width },
		font: { loadSystemFonts: true },
	})
		.render()
		.asPng();
}
