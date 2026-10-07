const HTTPS_PREFIX = 'https://';
const IMAGE_URI_PREFIX = 'spotify:image:';
const MOSAIC_URI_PREFIX = 'spotify:mosaic:';
const IMAGE_BASE_URL = 'https://i.scdn.co/image/';
const MOSAIC_BASE_URL = 'https://mosaic.scdn.co/300/';
const URI_SEPARATOR = ':';

/**
 * Turns an image reference of Spotify's internal platform into a URL that can be downloaded.
 * Handles `https://` URLs, `spotify:image:<id>` and `spotify:mosaic:<id>:<id>...`; any other scheme gives `undefined`.
 */
export function resolveSpotifyImageUrl(rawUrl: string): string | undefined {
	if (rawUrl.startsWith(HTTPS_PREFIX)) {
		return rawUrl;
	}
	if (rawUrl.startsWith(IMAGE_URI_PREFIX)) {
		const imageId = rawUrl.slice(IMAGE_URI_PREFIX.length);
		return imageId === '' ? undefined : `${IMAGE_BASE_URL}${imageId}`;
	}
	if (rawUrl.startsWith(MOSAIC_URI_PREFIX)) {
		const imageIds = rawUrl
			.slice(MOSAIC_URI_PREFIX.length)
			.split(URI_SEPARATOR)
			.filter((imageId) => imageId !== '');
		return imageIds.length === 0
			? undefined
			: `${MOSAIC_BASE_URL}${imageIds.join('')}`;
	}
	return undefined;
}
