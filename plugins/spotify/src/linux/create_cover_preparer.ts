import { escapeXml } from 'deck-kit/text/escape_xml';

import { toPngDataUrl } from './to_png_data_url';

const COVER_SIZE = 256;

function buildCoverSvg(coverDataUrl: string): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${COVER_SIZE}" height="${COVER_SIZE}"><image width="${COVER_SIZE}" height="${COVER_SIZE}" preserveAspectRatio="xMidYMid slice" xlink:href="${escapeXml(coverDataUrl)}"/></svg>`;
}

/**
 * Builds the function that shrinks a cover once to a 256 px square PNG, so the frames that embed it later decode a small image instead of Spotify's 640 px JPEG on every redraw.
 * A cover that cannot be shrunk is kept as downloaded.
 */
export function createCoverPreparer(
	renderPng: (svg: string) => Promise<Buffer>
): (coverDataUrl: string) => Promise<string> {
	return async (coverDataUrl) => {
		try {
			return toPngDataUrl(await renderPng(buildCoverSvg(coverDataUrl)));
		} catch {
			return coverDataUrl;
		}
	};
}
