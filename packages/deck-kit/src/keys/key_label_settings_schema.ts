import { z } from 'zod';

/** Settings of the label the plugin draws on a key, written by the property inspector; unknown keys are ignored. */
export const keyLabelSettingsSchema = z.object({
	label: z.string().optional(),
	labelPosition: z.enum(['top', 'bottom']).optional(),
});
