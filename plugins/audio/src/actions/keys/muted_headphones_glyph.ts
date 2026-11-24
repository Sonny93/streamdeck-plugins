/** The struck-through headphones of a "Listen toggle" key that is off, drawn in a 24×24 box like the images of the manifest. */
export function mutedHeadphonesGlyph(color: string): string {
	return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 15v-3a8.5 8.5 0 0 1 17 0v3"/><path d="M3.5 15h2.5a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M20.5 15H18a1.5 1.5 0 0 0-1.5 1.5v3A1.5 1.5 0 0 0 18 21h1a1.5 1.5 0 0 0 1.5-1.5z"/><path d="M4 4l16 16" stroke-width="2.4"/></g>`;
}
