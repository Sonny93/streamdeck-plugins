import type { Language } from 'deck-kit/i18n/language';

import { climateMessages } from '../i18n/climate_messages';
import type { SaveUnitAddressOutcome } from './save_unit_address';

const MESSAGE_KEYS = {
	saved: 'addressSaved',
	invalid: 'addressInvalid',
	'no-answer': 'addressNoAnswer',
	incompatible: 'addressIncompatible',
} as const satisfies Record<SaveUnitAddressOutcome, string>;

/** The short message a property inspector shows for the outcome of saving an address, in a language. */
export function describeSaveOutcome(
	outcome: SaveUnitAddressOutcome,
	language: Language
): string {
	return climateMessages.text(MESSAGE_KEYS[outcome], language);
}
