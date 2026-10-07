import { z } from 'zod';

/** Per-dial settings: the playlist the dial currently shows; unknown keys are ignored. */
export const playlistsDialSettingsSchema = z.object({
	selectedUri: z.string().optional(),
});
