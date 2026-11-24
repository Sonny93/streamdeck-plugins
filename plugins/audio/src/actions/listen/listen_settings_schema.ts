import { keyLabelSettingsSchema } from 'deck-kit/keys/key_label_settings_schema';
import { z } from 'zod';

/**
 * Per-action settings of the listen actions: the picked input, the maximum level of the dial and, on keys, the drawn label; unknown keys are ignored.
 * The property inspector stores the maximum level as a string or a number, so both are accepted and `readListenTarget` makes sense of it.
 */
export const listenSettingsSchema = keyLabelSettingsSchema.extend({
	device: z.string().optional(),
	maximumLevel: z.union([z.string(), z.number()]).optional(),
});
