import { clampPercent } from '../shared/clamp_percent';
import { SdrNits } from './sdr_nits';

const PERCENT = 100;

/** Converts a percentage to the SDR brightness of an HDR output, from 100 to 1000 nits. */
export function percentToSdrNits(percent: number): number {
	return Math.round(
		SdrNits.minimum +
			(clampPercent(percent) * (SdrNits.maximum - SdrNits.minimum)) / PERCENT
	);
}
