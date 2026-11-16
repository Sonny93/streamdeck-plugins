import type { StripBackgroundTone } from 'deck-kit/strip/strip_background_tone';

import type { StripTone } from './strip_tone';

const DARKENING = '#000000';

/** The background of each tone: two dark gradient stops, so light text and the sky blue accent stay readable over the whole strip, and black circles. */
export const StripTones: Readonly<Record<StripTone, StripBackgroundTone>> = {
	sky: { from: '#0C4A6E', to: '#082F49', decoration: DARKENING },
	neutral: { from: '#2B2B2B', to: '#151515', decoration: DARKENING },
};
