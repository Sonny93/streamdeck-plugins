import { SpotifyServices } from './spotify_services';
import type { SpotifySession } from './spotify_session';
import type { SpotifyPlaylist } from './spotify_playlist';
import { runPlatformScript } from './run_platform_script';
import { parsePlaylistListing } from './parse_playlist_listing';

const FOLDER_TYPE = 'folder';
const PLAYLIST_TYPE = 'playlist';
const PREFERRED_IMAGE_LABEL = 'standard';

const LIST_PLAYLISTS_BODY = `
	const folderType = ${JSON.stringify(FOLDER_TYPE)};
	const playlistType = ${JSON.stringify(PLAYLIST_TYPE)};
	const preferredImageLabel = ${JSON.stringify(PREFERRED_IMAGE_LABEL)};
	const rootlist = resolve(${JSON.stringify(SpotifyServices.rootlist)});
	const likedSongsUri = String(resolve(${JSON.stringify(SpotifyServices.likedSongsUri)}));
	const contents = await rootlist.getContents();
	const playlists = [];
	const collect = (items) => {
		for (const item of items ?? []) {
			if (item.type === folderType) {
				collect(item.items);
				continue;
			}
			if (item.type !== playlistType || !item.name) { continue; }
			const images = item.images ?? [];
			const image = images.find((candidate) => candidate.label === preferredImageLabel) ?? images[0];
			playlists.push({
				uri: item.uri,
				name: item.name,
				imageUrl: image?.url ?? null,
				canAdd: item.canAdd === true,
			});
		}
	};
	collect(contents.items);
	return { likedSongsUri, playlists };
`;

/**
 * Lists the playlists of the user's library, Liked Songs first.
 * Entries without a name (placeholders Spotify has not hydrated at all) are left out; named ones are kept even when Spotify has not fully loaded them.
 */
export async function listSpotifyPlaylists(
	session: SpotifySession
): Promise<SpotifyPlaylist[]> {
	return parsePlaylistListing(
		await runPlatformScript(session, LIST_PLAYLISTS_BODY)
	);
}
