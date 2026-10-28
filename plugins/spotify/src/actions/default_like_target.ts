import { SpotifyPlaylistKind } from '../spotify/spotify_playlist_kind';

/** The like target used while none was picked on the Playlists dial: Liked Songs, which needs no URI. */
export const DefaultLikeTarget = {
	uri: undefined,
	name: 'Liked Songs',
	kind: SpotifyPlaylistKind.likedSongs,
} as const;
