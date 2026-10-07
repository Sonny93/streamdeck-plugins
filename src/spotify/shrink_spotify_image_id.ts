import { SpotifyImageSizePrefixes } from './spotify_image_size_prefixes';

const SIZE_PREFIX_LENGTH = 16;

/** Swaps the size prefix of an i.scdn.co image id for the one of its ~64 px variant; unknown prefixes are left unchanged. */
export function shrinkSpotifyImageId(imageId: string): string {
	const smallerPrefix =
		SpotifyImageSizePrefixes[imageId.slice(0, SIZE_PREFIX_LENGTH)];
	return smallerPrefix === undefined
		? imageId
		: `${smallerPrefix}${imageId.slice(SIZE_PREFIX_LENGTH)}`;
}
