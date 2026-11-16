import type { Language } from 'deck-kit/i18n/language';

import { spotifyMessages } from '../i18n/spotify_messages';
import type { SpotifyPlaylist } from '../spotify/spotify_playlist';
import { SpotifyPlaylistKind } from '../spotify/spotify_playlist_kind';

/** The name shown for a playlist: the name Spotify gave it, except Liked Songs, which is named in the language of the plugin. */
export function resolvePlaylistName(
	options: Readonly<{
		playlist: Readonly<Pick<SpotifyPlaylist, 'name' | 'kind'>>;
		language: Language;
	}>
): string {
	const { playlist, language } = options;
	return playlist.kind === SpotifyPlaylistKind.likedSongs
		? spotifyMessages.text('likedSongs', language)
		: playlist.name;
}
