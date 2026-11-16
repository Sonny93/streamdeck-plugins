import { z } from 'zod';

/** Messages the property inspectors send to the plugin about the shared settings (the address of the unit, the language); anything else is ignored. */
export const inspectorMessageSchema = z.discriminatedUnion('event', [
	z.object({ event: z.literal('getUnitAddress') }),
	z.object({ event: z.literal('saveUnitAddress'), address: z.string() }),
	z.object({ event: z.literal('getLanguage') }),
	z.object({
		event: z.literal('saveLanguage'),
		setting: z.enum(['system', 'en', 'fr']),
	}),
]);
