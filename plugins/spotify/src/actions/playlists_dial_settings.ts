import type { z } from 'zod';

import type { playlistsDialSettingsSchema } from './playlists_dial_settings_schema';

/** Settings persisted by a "Playlists" dial so its selection survives restarts. */
export type PlaylistsDialSettings = z.output<
	typeof playlistsDialSettingsSchema
>;
