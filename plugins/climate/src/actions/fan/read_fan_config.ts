import { z } from 'zod';

import type { FanConfig } from './fan_config';

const fanSettingsSchema = z.object({
	control: z.enum(['rate', 'swing']).optional().catch(undefined),
});

/** Reads the settings of a "Fan" key; a missing or invalid control falls back to the fan rate. */
export function readFanConfig(rawSettings: unknown): FanConfig {
	const parsed = fanSettingsSchema.safeParse(rawSettings);
	return { control: parsed.success ? (parsed.data.control ?? 'rate') : 'rate' };
}
