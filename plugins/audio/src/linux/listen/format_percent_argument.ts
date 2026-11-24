import { clampListenLevel } from './clamp_listen_level';

const PERCENT_SCALE = 100;
const DECIMAL_SCALE = 10;

/** Formats a level from 0 to 1 as a `pactl` percent with at most one decimal (`8%`, `8.5%`), clamped to 0 to 100 %. */
export function formatPercentArgument(level: number): string {
	const percent =
		Math.round(clampListenLevel(level) * PERCENT_SCALE * DECIMAL_SCALE) /
		DECIMAL_SCALE;
	return `${percent}%`;
}
