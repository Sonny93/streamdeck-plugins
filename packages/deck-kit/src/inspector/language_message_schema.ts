import { z } from 'zod';

/** Messages a property inspector sends to ask for the language setting or to change it; anything else is not about the language. */
export const languageMessageSchema = z.discriminatedUnion('event', [
	z.object({ event: z.literal('getLanguage') }),
	z.object({
		event: z.literal('saveLanguage'),
		setting: z.enum(['system', 'en', 'fr']),
	}),
]);
