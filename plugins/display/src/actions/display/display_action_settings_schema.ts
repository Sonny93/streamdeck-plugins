import { keyLabelSettingsSchema } from 'deck-kit/keys/key_label_settings_schema';
import { z } from 'zod';

/** A percentage typed in a property inspector, which may come as text; anything else is dropped. */
const percentSchema = z.coerce
	.number()
	.int()
	.min(0)
	.max(100)
	.optional()
	.catch(undefined);

/**
 * Per-action settings of the display actions, written by their property inspector; each action reads the ones it uses.
 * Unknown keys are ignored and invalid values fall back to the defaults.
 */
export const displayActionSettingsSchema = keyLabelSettingsSchema.extend({
	monitor: z.string().optional().catch(undefined),
	brightnessControl: z
		.enum(['auto', 'monitor', 'windows'])
		.optional()
		.catch(undefined),
	offMode: z.enum(['blackScreen', 'standby']).optional().catch(undefined),
	brightnessKeyMode: z.enum(['set', 'up', 'down']).optional().catch(undefined),
	value: percentSchema,
	step: percentSchema,
	preset: percentSchema,
});
