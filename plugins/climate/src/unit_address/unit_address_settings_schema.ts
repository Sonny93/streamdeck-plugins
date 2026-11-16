import { z } from 'zod';

/** Plugin-wide settings: the address of the unit. It lives here and never in the settings of an action, because exported profiles are committed. */
export const unitAddressSettingsSchema = z.object({
	host: z.string().optional(),
});
