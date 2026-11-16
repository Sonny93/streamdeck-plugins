import { z } from 'zod';

import type { WritableSpecialMode } from '../../daikin/unit_types';
import { readKeyLabelPreferences } from '../shared/read_key_label_preferences';
import type { SpecialModeConfig } from './special_mode_config';

const DEFAULT_MODE: WritableSpecialMode = 'powerful';

const specialModeSettingsSchema = z.object({
	mode: z.enum(['powerful', 'econo']).optional().catch(undefined),
});

/** Reads the settings of a "Special mode" key; a missing or invalid mode falls back to powerful. */
export function readSpecialModeConfig(rawSettings: unknown): SpecialModeConfig {
	const parsed = specialModeSettingsSchema.safeParse(rawSettings);
	return {
		mode: (parsed.success ? parsed.data.mode : undefined) ?? DEFAULT_MODE,
		label: readKeyLabelPreferences(rawSettings),
	};
}
