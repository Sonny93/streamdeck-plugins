import type { Language } from 'deck-kit/i18n/language';

import type { SpecialMode } from '../../daikin/unit_types';
import { climateMessages } from '../../i18n/climate_messages';

const SPECIAL_MODE_KEYS = {
	powerful: 'specialPowerful',
	econo: 'specialEcono',
	streamer: 'specialStreamer',
} as const satisfies Record<SpecialMode, string>;

/** How a special mode of the unit is named on the keys and the strips, in a language. */
export function getSpecialModeName(
	mode: SpecialMode,
	language: Language
): string {
	return climateMessages.text(SPECIAL_MODE_KEYS[mode], language);
}
