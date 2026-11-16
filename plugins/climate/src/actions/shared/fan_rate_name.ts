import type { Language } from 'deck-kit/i18n/language';

import type { FanRate } from '../../daikin/unit_types';
import { climateMessages } from '../../i18n/climate_messages';

/** How a fan rate is named on the keys and the strips, in a language: words for auto and silent, the digit for the others. */
export function getFanRateName(rate: FanRate, language: Language): string {
	if (rate === 'auto') {
		return climateMessages.text('fanRateAuto', language);
	}
	if (rate === 'silent') {
		return climateMessages.text('fanRateSilent', language);
	}
	return String(rate);
}
