/** The speaker of the "Default Output" key, drawn in a 24×24 box like the images of the manifest. */
export function speakerGlyph(color: string): string {
	return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3l4.5-4v13l-4.5-4H4z"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M17.8 6.2a8 8 0 0 1 0 11.6"/></g>`;
}
