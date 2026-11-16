import { formatDecimal } from 'deck-kit/i18n/format_decimal';
import type { Language } from 'deck-kit/i18n/language';

const NO_TEMPERATURE = '–';
const DEGREE_UNIT = '°C';
const HALF_DEGREE_DIGITS = 1;

function formatNumber(temperature: number, language: Language): string {
	return Number.isInteger(temperature)
		? String(temperature)
		: formatDecimal(temperature, HALF_DEGREE_DIGITS, language);
}

/** Formats a temperature for a key or the strip: whole degrees without decimals, half degrees with the decimal separator of the language, `23,5 °C` or `23.5 °C`, a dash when there is none. */
export function formatTemperature(
	temperature: number | null | undefined,
	language: Language
): string {
	if (temperature === null || temperature === undefined) {
		return NO_TEMPERATURE;
	}
	return `${formatNumber(temperature, language)} ${DEGREE_UNIT}`;
}
