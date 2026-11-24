import { z } from 'zod';

/** One channel of a `volume` object in the JSON of `pactl`. */
export const pactlChannelSchema = z.object({
	value: z.number().optional(),
	value_percent: z.string().optional(),
});
