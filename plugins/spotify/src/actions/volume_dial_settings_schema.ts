import { z } from 'zod';

/** Per-dial settings of a "Volume" dial: whose volume it controls and, for a picked app, its executable name; unknown keys are ignored. */
export const volumeDialSettingsSchema = z.object({
	target: z.enum(['spotify', 'focused', 'app']).optional(),
	appImageName: z.string().optional(),
});
