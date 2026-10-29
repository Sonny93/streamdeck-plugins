const MIN_PERCENT = 0;
const MAX_PERCENT = 100;

/** Rounds a percentage to a whole number between 0 and 100. */
export function clampPercent(value: number): number {
	return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, Math.round(value)));
}
