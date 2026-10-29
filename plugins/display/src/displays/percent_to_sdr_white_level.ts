import { clampPercent } from '../shared/clamp_percent';
import { SdrWhiteLevel } from './sdr_white_level';

const PERCENT = 100;

/** Converts a position of the "SDR content brightness" slider of Windows to the white level of SDR content. */
export function percentToSdrWhiteLevel(percent: number): number {
	return Math.round(
		SdrWhiteLevel.minimum +
			(clampPercent(percent) *
				(SdrWhiteLevel.maximum - SdrWhiteLevel.minimum)) /
				PERCENT
	);
}
