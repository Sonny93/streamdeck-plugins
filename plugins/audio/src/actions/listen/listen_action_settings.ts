import type { z } from 'zod';

import type { listenSettingsSchema } from './listen_settings_schema';

/** Settings persisted by a listen action, edited in its property inspector. */
export type ListenActionSettings = z.output<typeof listenSettingsSchema>;
