import { z } from 'zod';

import { SpotifyPlaylistKind } from '../spotify/spotify_playlist_kind';

/** Plugin-wide settings: the playlist that the "like" key adds the playing track to; unknown keys are ignored. */
export const likeTargetSettingsSchema = z.object({
	likeTarget: z
		.object({
			uri: z.string(),
			name: z.string(),
			kind: z.enum(SpotifyPlaylistKind),
		})
		.optional(),
});
