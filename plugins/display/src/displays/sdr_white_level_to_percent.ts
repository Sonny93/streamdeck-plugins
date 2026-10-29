import { clampPercent } from '../shared/clamp_percent';
import { SdrWhiteLevel } from './sdr_white_level';

const PERCENT = 100;

/** Converts a white level of SDR content to the position of the "SDR content brightness" slider of Windows. */
export function sdrWhiteLevelToPercent(level: number): number {
	return clampPercent(
		((level - SdrWhiteLevel.minimum) * PERCENT) /
			(SdrWhiteLevel.maximum - SdrWhiteLevel.minimum)
	);
}
