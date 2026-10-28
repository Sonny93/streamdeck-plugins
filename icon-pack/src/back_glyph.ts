/** An arrow turning back, drawn in a 24×24 box. */
export function backGlyph(color: string): string {
	return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 4.5 4.5 9.5l5 5"/><path d="M4.5 9.5h10a5 5 0 0 1 0 10H11"/></g>`;
}
