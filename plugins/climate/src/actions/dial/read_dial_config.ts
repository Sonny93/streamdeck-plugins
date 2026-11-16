import { z } from 'zod';

import type { DialConfig } from './dial_config';

const DEFAULT_STEP = 0.5;

const dialSettingsSchema = z.object({
	step: z
		.preprocess(
			(value) => (typeof value === 'string' ? Number(value) : value),
			z.union([z.literal(0.5), z.literal(1)])
		)
		.optional()
		.catch(undefined),
});

/** Reads the settings of a "Climate" dial; a missing or invalid step falls back to half a degree. */
export function readDialConfig(rawSettings: unknown): DialConfig {
	const parsed = dialSettingsSchema.safeParse(rawSettings);
	return {
		step: parsed.success ? (parsed.data.step ?? DEFAULT_STEP) : DEFAULT_STEP,
	};
}
