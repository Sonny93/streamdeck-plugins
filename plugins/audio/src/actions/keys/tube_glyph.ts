/** The vacuum tube of the Volt 1 "Vintage" key, drawn in a 24×24 box like the images of the manifest. */
export function tubeGlyph(color: string): string {
	return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 18.5V9a4.5 4.5 0 0 1 9 0v9.5z"/><path d="M5.5 18.5h13"/><path d="M9 18.5v3M12 18.5v3M15 18.5v3"/><path d="M10 15.5v-4l2 2 2-2v4" stroke-width="1.6"/></g>`;
}
