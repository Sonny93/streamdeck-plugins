import { z } from 'zod';

/** Messages the property inspectors send to the plugin about the address of the unit; anything else is ignored. */
export const unitAddressMessageSchema = z.discriminatedUnion('event', [
	z.object({ event: z.literal('getUnitAddress') }),
	z.object({ event: z.literal('saveUnitAddress'), address: z.string() }),
]);
