import { z } from 'zod';

/** Schema of the `/json/list` DevTools payload. */
export const spotifyTargetListSchema = z.array(
	z.object({
		id: z.string(),
		type: z.string(),
		url: z.string(),
		webSocketDebuggerUrl: z.string().optional(),
	})
);
