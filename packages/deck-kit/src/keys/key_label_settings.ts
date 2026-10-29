import type { z } from 'zod';

import type { keyLabelSettingsSchema } from './key_label_settings_schema';

/** Settings persisted by a key that draws a label, edited in its property inspector. */
export type KeyLabelSettings = z.output<typeof keyLabelSettingsSchema>;
