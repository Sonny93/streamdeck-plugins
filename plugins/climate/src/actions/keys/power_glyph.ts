/** The power symbol of the "Power" key, drawn in a 24×24 box like the images of the manifest. */
export function powerGlyph(color: string): string {
	return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v8"/><path d="M6.4 6.4a8 8 0 1 0 11.2 0"/></g>`;
}
