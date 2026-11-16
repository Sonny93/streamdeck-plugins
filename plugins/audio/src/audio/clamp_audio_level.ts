const MIN_LEVEL = 0;
const MAX_LEVEL = 1;
const LEVEL_PRECISION = 100;

/** Rounds a volume level to a whole percent and keeps it between 0 and 1. */
export function clampAudioLevel(level: number): number {
	const rounded = Math.round(level * LEVEL_PRECISION) / LEVEL_PRECISION;
	return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, rounded));
}
