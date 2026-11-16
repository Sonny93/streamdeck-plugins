const NO_TEMPERATURE = '–';
const DEGREE_UNIT = '°C';

function formatNumber(temperature: number): string {
	return Number.isInteger(temperature)
		? String(temperature)
		: temperature.toFixed(1).replace('.', ',');
}

/** Formats a temperature for a key or the strip, in French: whole degrees without decimals, half degrees with a comma, `23,5 °C`, a dash when there is none. */
export function formatTemperature(
	temperature: number | null | undefined
): string {
	if (temperature === null || temperature === undefined) {
		return NO_TEMPERATURE;
	}
	return `${formatNumber(temperature)} ${DEGREE_UNIT}`;
}
