const SVG_DATA_URL_PREFIX = 'data:image/svg+xml;base64,';

/** Encodes an SVG document as a `data:` URL that Stream Deck can display. */
export function toSvgDataUrl(svg: string): string {
	return `${SVG_DATA_URL_PREFIX}${Buffer.from(svg, 'utf8').toString('base64')}`;
}
