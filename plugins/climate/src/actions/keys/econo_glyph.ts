/** The leaf of the "Special mode" key in econo mode, drawn in a 24×24 box like the images of the manifest. */
export function econoGlyph(color: string): string {
	return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.480 19 2c1 2 2 4.180 2 8 0 5.5-4.780 10-10 10z"/><path d="M2 21c0-3 1.850-5.360 5.080-6C9.5 14.520 12 13 13 12"/></g>`;
}
