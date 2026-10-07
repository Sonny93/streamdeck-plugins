import type { z } from 'zod';

import type { likeTargetSettingsSchema } from './like_target_settings_schema';

/** Plugin-wide settings stored in the Stream Deck global settings. */
export type LikeTargetSettings = z.output<typeof likeTargetSettingsSchema>;
