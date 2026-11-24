import { InvalidListenLevelError } from './invalid_listen_level_error';

/** Clamps a listening level to 0 to 1; throws when it is not a finite number. */
export function clampListenLevel(level: number): number {
	if (!Number.isFinite(level)) {
		throw new InvalidListenLevelError();
	}
	return Math.min(1, Math.max(0, level));
}
