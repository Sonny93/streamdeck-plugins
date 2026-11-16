import { formatDecimal } from 'deck-kit/i18n/format_decimal';
import type { Language } from 'deck-kit/i18n/language';

const NO_TEMPERATURE = '–';
const HALF_DEGREE_DIGITS = 1;

/** Formats a temperature in the large figures of a strip, where the unit would not fit: `23,5°` or `23.5°`, a dash when there is none. */
export function formatCompactTemperature(
	temperature: number | null | undefined,
	language: Language
): string {
	if (temperature === null || temperature === undefined) {
		return NO_TEMPERATURE;
	}
	const number = Number.isInteger(temperature)
		? String(temperature)
		: formatDecimal(temperature, HALF_DEGREE_DIGITS, language);
	return `${number}°`;
}
