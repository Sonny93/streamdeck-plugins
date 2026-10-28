import type { z } from 'zod';

import type { spotifyTargetListSchema } from './spotify_target_list_schema';

/** One entry of the `/json/list` DevTools payload. */
export type SpotifyTarget = z.output<typeof spotifyTargetListSchema>[number];
