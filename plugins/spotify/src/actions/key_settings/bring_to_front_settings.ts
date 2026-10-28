import type { z } from 'zod';

import type { bringToFrontSettingsSchema } from './bring_to_front_settings_schema';

/** Settings of a key that can optionally bring Spotify to the front. */
export type BringToFrontSettings = z.output<typeof bringToFrontSettingsSchema>;
