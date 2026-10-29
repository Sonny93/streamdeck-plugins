/** The "HDR" badge of the "HDR" key, drawn in a 24×24 box like the images of the manifest. */
export function hdrGlyph(color: string): string {
	return `<g fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"><rect x="1.5" y="5.5" width="21" height="13" rx="3"/></g><text x="12" y="15.2" fill="${color}" font-family="Segoe UI, Arial, sans-serif" font-size="7.4" font-weight="bold" text-anchor="middle">HDR</text>`;
}
