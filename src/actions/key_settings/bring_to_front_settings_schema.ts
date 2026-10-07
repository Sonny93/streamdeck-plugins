import { z } from 'zod';

/** Per-key settings written by the property inspector; unknown keys are ignored. */
export const bringToFrontSettingsSchema = z.object({
	bringToFront: z.boolean().optional(),
});
