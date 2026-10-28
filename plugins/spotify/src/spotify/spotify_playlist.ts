import type { SpotifyPlaylistKind } from './spotify_playlist_kind';

/** A playlist of the user's library; `canAdd` tells whether tracks can be added to it. */
export type SpotifyPlaylist = Readonly<{
	uri: string;
	name: string;
	imageUrl: string | undefined;
	kind: (typeof SpotifyPlaylistKind)[keyof typeof SpotifyPlaylistKind];
	canAdd: boolean;
}>;
