import { parsePlaylistListing } from './parse_playlist_listing';
import { runPlatformScript } from './run_platform_script';
import type { SpotifyPlaylist } from './spotify_playlist';
import { SpotifyServices } from './spotify_services';
import type { SpotifySession } from './spotify_session';

const FOLDER_TYPE = 'folder';
const PLAYLIST_TYPE = 'playlist';
const PREFERRED_IMAGE_LABELS = ['small', 'standard'];
const LIBRARY_PAGE_SIZE = 100;

const LIST_PLAYLISTS_BODY = `
	const folderType = ${JSON.stringify(FOLDER_TYPE)};
	const playlistType = ${JSON.stringify(PLAYLIST_TYPE)};
	const preferredImageLabels = ${JSON.stringify(PREFERRED_IMAGE_LABELS)};
	const pageSize = ${JSON.stringify(LIBRARY_PAGE_SIZE)};
	const library = resolve(${JSON.stringify(SpotifyServices.library)});
	const likedSongsUri = String(resolve(${JSON.stringify(SpotifyServices.likedSongsUri)}));
	const filterId = library.getStaticallyKnownFilters().playlist.filterId;
	const items = [];
	let total = 0;
	do {
		const page = await library.getContents({ filters: [filterId], limit: pageSize, offset: items.length });
		total = page.totalLength;
		if (page.items.length === 0) { break; }
		items.push(...page.items);
	} while (items.length < total);
	const rootlistImages = new Map();
	const collect = (rootItems) => {
		for (const rootItem of rootItems ?? []) {
			if (rootItem.type === folderType) {
				collect(rootItem.items);
				continue;
			}
			if (rootItem.type !== playlistType) { continue; }
			const images = rootItem.images ?? [];
			const image = preferredImageLabels.map((label) => images.find((candidate) => candidate.label === label)).find((candidate) => candidate !== undefined) ?? images[0];
			rootlistImages.set(rootItem.uri, image?.url ?? null);
		}
	};
	collect((await resolve(${JSON.stringify(SpotifyServices.rootlist)}).getContents()).items);
	const smallest = (images) => images.reduce((best, candidate) => best === undefined || (candidate.width ?? Infinity) < (best.width ?? Infinity) ? candidate : best, undefined);
	const playlists = [];
	for (const item of items) {
		if (item.type !== playlistType || !item.name) { continue; }
		playlists.push({
			uri: item.uri,
			name: item.name,
			imageUrl: rootlistImages.has(item.uri) ? rootlistImages.get(item.uri) : (smallest(item.images ?? [])?.url ?? null),
			canAdd: item.canAddTo === true,
			isOwnedBySelf: item.isOwnedBySelf === true,
		});
	}
	return { likedSongsUri, playlists };
`;

/**
 * Lists the playlists of the user's library in the order of Spotify's sidebar (pinned first, then the sort the user picked), with Liked Songs first, then the user's own playlists, then the others.
 * Each cover comes from the root list (label small, then standard, then the first image), which offers smaller images than the library; the smallest library image is used for a playlist the root list does not know.
 * Entries without a name (placeholders Spotify has not hydrated at all) are left out; named ones are kept even when Spotify has not fully loaded them.
 */
export async function listSpotifyPlaylists(
	session: SpotifySession
): Promise<SpotifyPlaylist[]> {
	return parsePlaylistListing(
		await runPlatformScript(session, LIST_PLAYLISTS_BODY)
	);
}
