import type { SpotifyPlaylist } from '../spotify/spotify_playlist';

/**
 * Finds the index of the selected playlist in the list.
 * Falls back to the first playlist when nothing is selected or the selected playlist is no longer listed.
 */
export function resolveSelectedIndex(
	options: Readonly<{
		playlists: readonly SpotifyPlaylist[];
		selectedUri: string | undefined;
	}>
): number {
	const index = options.playlists.findIndex(
		(playlist) => playlist.uri === options.selectedUri
	);
	return Math.max(index, 0);
}
