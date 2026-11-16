import type { StripBackgroundTone } from 'deck-kit/strip/strip_background_tone';

import type { StripTone } from './strip_tone';

const DARKENING = '#000000';

/** The background of each tone: two dark gradient stops, so light text and the amber accent stay readable over the whole strip, and black circles. */
export const StripTones: Readonly<Record<StripTone, StripBackgroundTone>> = {
	amber: { from: '#4A3000', to: '#2E1D00', decoration: DARKENING },
	neutral: { from: '#2B2B2B', to: '#151515', decoration: DARKENING },
};
