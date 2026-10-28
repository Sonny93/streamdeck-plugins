import { SpotifyPlaylistKind } from './spotify_playlist_kind';
import { SpotifyServices } from './spotify_services';

const PLAYLIST_PAGE_SIZE = 500;

/**
 * Builds the snippet, to embed in a `buildPlatformExpression` body, that defines
 * `const isTrackInTarget = async (trackUri, target) => boolean` where `target` is `{ uri, kind }`.
 * Liked Songs are checked through the library service; a playlist is scanned page by page until the track is found or the end is reached.
 */
export function buildTrackPresenceSnippet(): string {
	return `
		const isTrackInTarget = async (trackUri, target) => {
			if (target.kind === ${JSON.stringify(SpotifyPlaylistKind.likedSongs)}) {
				const [isSaved] = await resolve(${JSON.stringify(SpotifyServices.library)}).contains(trackUri);
				return isSaved === true;
			}
			if (typeof target.uri !== 'string') {
				throw new TypeError('A playlist like target needs a uri');
			}
			const playlistApi = resolve(${JSON.stringify(SpotifyServices.playlist)});
			let offset = 0;
			let totalLength = 0;
			do {
				const contents = await playlistApi.getContents(target.uri, { offset, limit: ${PLAYLIST_PAGE_SIZE} });
				const items = contents.items ?? [];
				if (items.some((item) => item.uri === trackUri)) { return true; }
				if (items.length === 0) { return false; }
				offset += items.length;
				totalLength = contents.totalLength ?? 0;
			} while (offset < totalLength);
			return false;
		};
	`;
}
