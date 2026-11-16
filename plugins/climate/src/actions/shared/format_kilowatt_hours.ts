import { formatDecimal } from 'deck-kit/i18n/format_decimal';
import type { Language } from 'deck-kit/i18n/language';

const NO_ENERGY = '–';
const FRACTION_DIGITS = 1;

/** Formats an energy in kWh with one decimal and the decimal separator of the language, a dash when there is none. */
export function formatKilowattHours(
	kilowattHours: number | undefined,
	language: Language
): string {
	return kilowattHours === undefined
		? NO_ENERGY
		: formatDecimal(kilowattHours, FRACTION_DIGITS, language);
}
