import { clampPercent } from '../shared/clamp_percent';
import { SdrNits } from './sdr_nits';

const PERCENT = 100;

/** Converts the SDR brightness of an HDR output, from 100 to 1000 nits, to a percentage. */
export function sdrNitsToPercent(nits: number): number {
	return clampPercent(
		((nits - SdrNits.minimum) * PERCENT) / (SdrNits.maximum - SdrNits.minimum)
	);
}
