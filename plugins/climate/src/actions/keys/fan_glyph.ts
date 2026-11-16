/** The three-blade fan of the "Fan" key, drawn in a 24×24 box like the images of the manifest. */
export function fanGlyph(color: string): string {
	const blade = '<path d="M12 10c-1.8-2-2-5.5 0-7 2 1.5 1.8 5 0 7z"/>';
	return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.6"/>${blade}<g transform="rotate(120 12 12)">${blade}</g><g transform="rotate(240 12 12)">${blade}</g></g>`;
}
