import type { SpotifyPlaylistKind } from './spotify_playlist_kind';

/** Where a track is liked to: Liked Songs (no URI needed) or the playlist with the given URI. */
export type LikeTargetRef = Readonly<{
	uri: string | undefined;
	kind: (typeof SpotifyPlaylistKind)[keyof typeof SpotifyPlaylistKind];
}>;
