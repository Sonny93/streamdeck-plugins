/** The sliders of the "Preset" key, drawn in a 24×24 box like the images of the manifest. */
export function presetGlyph(color: string): string {
	return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h10M19 7h2M3 17h2M11 17h10"/><circle cx="16" cy="7" r="2.5"/><circle cx="8" cy="17" r="2.5"/></g>`;
}
