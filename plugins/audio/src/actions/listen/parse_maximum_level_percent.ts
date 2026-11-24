import { ListenTiming } from '../../listen/listen_timing';

const MINIMUM_PERCENT = 1;
const MAXIMUM_PERCENT = 100;

function toNumber(value: unknown): number {
	if (typeof value === 'number') {
		return value;
	}
	if (typeof value !== 'string' || value.trim() === '') {
		return Number.NaN;
	}
	return Number(value.trim().replace(',', '.'));
}

/** Makes sense of the maximum level typed in a property inspector: a number or a numeric string, kept between 1 and 100 percent; anything else gives the default. */
export function parseMaximumLevelPercent(value: unknown): number {
	const number = toNumber(value);
	if (!Number.isFinite(number)) {
		return ListenTiming.defaultMaximumLevelPercent;
	}
	return Math.min(MAXIMUM_PERCENT, Math.max(MINIMUM_PERCENT, number));
}
