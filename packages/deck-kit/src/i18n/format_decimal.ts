import type { Language } from './language';

/** Formats a number with a fixed count of decimals, with the decimal separator of the language: a comma in French, a point in English. */
export function formatDecimal(
	value: number,
	fractionDigits: number,
	language: Language
): string {
	const text = value.toFixed(fractionDigits);
	return language === 'fr' ? text.replace('.', ',') : text;
}
