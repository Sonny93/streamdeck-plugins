import { fetchSpotifyJson } from './fetch_spotify_json';
import { findSpotifyPageTarget } from './find_spotify_page_target';
import { SpotifyPageNotFoundError } from './spotify_page_not_found_error';
import type { SpotifyPageTarget } from './spotify_page_target';
import { spotifyTargetListSchema } from './spotify_target_list_schema';

/** Lists DevTools targets and returns the Spotify UI page, or throws when it is not exposed yet. */
export async function fetchSpotifyPageTarget(): Promise<SpotifyPageTarget> {
	const targets = await fetchSpotifyJson({
		path: '/json/list',
		schema: spotifyTargetListSchema,
	});
	const pageTarget = findSpotifyPageTarget(targets);
	if (pageTarget === undefined) {
		throw new SpotifyPageNotFoundError();
	}
	return pageTarget;
}
