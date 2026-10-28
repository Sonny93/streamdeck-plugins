import { shrinkSpotifyImageId } from './shrink_spotify_image_id';

const HTTPS_PREFIX = 'https://';
const IMAGE_URI_PREFIX = 'spotify:image:';
const MOSAIC_URI_PREFIX = 'spotify:mosaic:';
const IMAGE_BASE_URL = 'https://i.scdn.co/image/';
const MOSAIC_BASE_URL = 'https://mosaic.scdn.co/60/';
const URI_SEPARATOR = ':';

/**
 * Turns an image reference of Spotify's internal platform into the URL of a small (~64 px) variant that can be downloaded.
 * Handles `https://` URLs, `spotify:image:<id>` and `spotify:mosaic:<id>:<id>...`; any other scheme gives `undefined`.
 * Known size prefixes of i.scdn.co image ids are swapped for their ~64 px variant; other URLs are returned as they are.
 */
export function resolveSpotifyImageUrl(rawUrl: string): string | undefined {
	if (rawUrl.startsWith(IMAGE_BASE_URL)) {
		return `${IMAGE_BASE_URL}${shrinkSpotifyImageId(rawUrl.slice(IMAGE_BASE_URL.length))}`;
	}
	if (rawUrl.startsWith(HTTPS_PREFIX)) {
		return rawUrl;
	}
	if (rawUrl.startsWith(IMAGE_URI_PREFIX)) {
		const imageId = rawUrl.slice(IMAGE_URI_PREFIX.length);
		return imageId === ''
			? undefined
			: `${IMAGE_BASE_URL}${shrinkSpotifyImageId(imageId)}`;
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
