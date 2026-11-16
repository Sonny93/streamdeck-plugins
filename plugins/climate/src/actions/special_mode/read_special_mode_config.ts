import { readKeyLabel } from 'deck-kit/keys/read_key_label';
import { z } from 'zod';

import type { WritableSpecialMode } from '../../daikin/unit_types';
import { SpecialModeNames } from '../shared/special_mode_names';
import type { SpecialModeConfig } from './special_mode_config';

const DEFAULT_MODE: WritableSpecialMode = 'powerful';

const specialModeSettingsSchema = z.object({
	mode: z.enum(['powerful', 'econo']).optional().catch(undefined),
});

/** Reads the settings of a "Special mode" key; a missing or invalid mode falls back to powerful, the label to the name of the mode. */
export function readSpecialModeConfig(rawSettings: unknown): SpecialModeConfig {
	const parsed = specialModeSettingsSchema.safeParse(rawSettings);
	const mode = (parsed.success ? parsed.data.mode : undefined) ?? DEFAULT_MODE;
	const label = readKeyLabel(rawSettings, SpecialModeNames[mode]);
	return {
		mode,
		label: label ?? { text: SpecialModeNames[mode], position: 'top' },
	};
}
