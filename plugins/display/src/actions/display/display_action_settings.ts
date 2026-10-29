import type { z } from 'zod';

import type { displayActionSettingsSchema } from './display_action_settings_schema';

/** Settings persisted by a display action, edited in its property inspector. */
export type DisplayActionSettings = z.output<
	typeof displayActionSettingsSchema
>;
