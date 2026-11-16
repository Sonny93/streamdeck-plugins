import { z } from 'zod';

/** The language setting inside the global settings of a plugin; a missing or unknown value reads as no setting. */
export const languageSettingsSchema = z.object({
	language: z.enum(['system', 'en', 'fr']).optional().catch(undefined),
});
