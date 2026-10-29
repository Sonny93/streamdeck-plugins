/** The struck-through screen of a "Screen Power" key whose screen is off, drawn in a 24×24 box like the images of the manifest. */
export function screenOffGlyph(color: string): string {
	return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M12 16.5V20M8 20h8"/><path d="M4 2.5l16 16" stroke-width="2.4"/></g>`;
}
