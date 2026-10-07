import type { FeedbackPayload } from '@elgato/streamdeck';

import { PlaylistsDialImages } from './playlists_dial_images';
import type { SpotifyPlaylist } from '../spotify/spotify_playlist';
import { formatPlaylistPosition } from './format_playlist_position';

const SPOTIFY_CLOSED_TITLE = 'Spotify closed';

type PlaylistFeedbackOptions = Readonly<{
	playlist: SpotifyPlaylist | undefined;
	index: number;
	total: number;
	isLikeTarget: boolean;
	coverDataUrl: string | undefined;
}>;

/**
 * Computes the touch strip feedback of the "Playlists" dial.
 * Without a playlist (Spotify is unreachable) it shows "Spotify closed" over the fallback cover.
 * The cover falls back to the Liked Songs image until the playlist cover is available.
 */
export function buildPlaylistFeedback(
	options: PlaylistFeedbackOptions
): FeedbackPayload {
	const { playlist } = options;
	const isLikeTarget = playlist !== undefined && options.isLikeTarget;
	return {
		cover: options.coverDataUrl ?? PlaylistsDialImages.fallbackCover,
		title: playlist?.name ?? SPOTIFY_CLOSED_TITLE,
		position:
			playlist === undefined
				? ''
				: formatPlaylistPosition({
						index: options.index,
						total: options.total,
					}),
		target: {
			value: isLikeTarget ? PlaylistsDialImages.likeTargetHeart : '',
			enabled: isLikeTarget,
		},
	};
}
