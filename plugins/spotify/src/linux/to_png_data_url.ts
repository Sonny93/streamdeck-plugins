const PNG_DATA_URL_PREFIX = 'data:image/png;base64,';

/** Encodes PNG bytes as a `data:` URL that Stream Deck software can display. */
export function toPngDataUrl(png: Uint8Array): string {
	return `${PNG_DATA_URL_PREFIX}${Buffer.from(png).toString('base64')}`;
}
