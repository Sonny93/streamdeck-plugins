import type { z } from 'zod';

import type { volumeDialSettingsSchema } from './volume_dial_settings_schema';

/** Settings persisted by a "Volume" dial, edited in its property inspector. */
export type VolumeDialSettings = z.output<typeof volumeDialSettingsSchema>;
