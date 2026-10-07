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
		})
	),
});

/**
 * Interprets the value produced by the playlist listing script.
 * Returns the Liked Songs entry first, followed by the playlists of the library in their order,
 * with their raw image references turned into downloadable URLs.
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
	const playlists = parsed.data.playlists.map((playlist): SpotifyPlaylist => ({
		uri: playlist.uri,
		name: playlist.name,
		imageUrl:
			playlist.imageUrl === null
				? undefined
				: resolveSpotifyImageUrl(playlist.imageUrl),
		kind: SpotifyPlaylistKind.playlist,
		canAdd: playlist.canAdd,
	}));
	return [likedSongs, ...playlists];
}
