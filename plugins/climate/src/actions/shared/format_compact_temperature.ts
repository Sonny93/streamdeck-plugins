const NO_TEMPERATURE = '–';

/** Formats a temperature in the large figures of a strip, where the unit would not fit: `23,5°`, a dash when there is none. */
export function formatCompactTemperature(
	temperature: number | null | undefined
): string {
	if (temperature === null || temperature === undefined) {
		return NO_TEMPERATURE;
	}
	const number = Number.isInteger(temperature)
		? String(temperature)
		: temperature.toFixed(1).replace('.', ',');
	return `${number}°`;
}
