import { z } from 'zod';

import type { SpotifyPlaylist } from './spotify_playlist';
import { SpotifyPlaylistKind } from './spotify_playlist_kind';
import { SpotifyEvaluationError } from './spotify_evaluation_error';
import { resolveSpotifyImageUrl } from './resolve_spotify_image_url';

const LIKED_SONGS_NAME = 'Liked Songs';

const playlistListingSchema = z.object({
	likedSongsUri: z.string(),
	playlists: z.array(
		z.object({
			uri: z.string(),
			name: z.string(),
			imageUrl: z.string().nullable(),
			canAdd: z.boolean(),
			isOwnedBySelf: z.boolean(),
		})
	),
});

/**
 * Interprets the value produced by the playlist listing script.
 * Returns the Liked Songs entry first, then the playlists owned by the user, then the other ones (generated mixes, followed playlists);
 * the library order is kept inside each group, and the raw image references are turned into downloadable URLs.
 */
export function parsePlaylistListing(rawListing: unknown): SpotifyPlaylist[] {
	const parsed = playlistListingSchema.safeParse(rawListing);
	if (!parsed.success) {
		throw new SpotifyEvaluationError({
			reason: 'the playlist listing has an unexpected shape',
			cause: parsed.error,
		});
	}
	const likedSongs: SpotifyPlaylist = {
		uri: parsed.data.likedSongsUri,
		name: LIKED_SONGS_NAME,
		imageUrl: undefined,
		kind: SpotifyPlaylistKind.likedSongs,
		canAdd: true,
	};
	const toPlaylist = (
		playlist: (typeof parsed.data.playlists)[number]
	): SpotifyPlaylist => ({
		uri: playlist.uri,
		name: playlist.name,
		imageUrl:
			playlist.imageUrl === null
				? undefined
				: resolveSpotifyImageUrl(playlist.imageUrl),
		kind: SpotifyPlaylistKind.playlist,
		canAdd: playlist.canAdd,
	});
	const owned = parsed.data.playlists.filter(
		(playlist) => playlist.isOwnedBySelf
	);
	const others = parsed.data.playlists.filter(
		(playlist) => !playlist.isOwnedBySelf
	);
	return [likedSongs, ...owned.map(toPlaylist), ...others.map(toPlaylist)];
}
