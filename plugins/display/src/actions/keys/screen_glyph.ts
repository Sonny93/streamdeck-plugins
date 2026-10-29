/** The screen of a lit "Screen Power" key, drawn in a 24×24 box like the images of the manifest. */
export function screenGlyph(color: string): string {
	return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M12 16.5V20M8 20h8"/></g>`;
}
