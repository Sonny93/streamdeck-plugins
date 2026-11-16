import type { Language } from 'deck-kit/i18n/language';

import type { UnitMode } from '../../daikin/unit_types';
import { climateMessages } from '../../i18n/climate_messages';

const MODE_KEYS = {
	auto: 'modeAuto',
	dry: 'modeDry',
	cool: 'modeCool',
	heat: 'modeHeat',
	fan: 'modeFan',
} as const satisfies Record<UnitMode, string>;

/** How a mode of the unit is named on the keys and the strips, in a language. */
export function getUnitModeName(mode: UnitMode, language: Language): string {
	return climateMessages.text(MODE_KEYS[mode], language);
}
