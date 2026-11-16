import type { StripBackgroundTone } from 'deck-kit/strip/strip_background_tone';

import type { StripTone } from './strip_tone';

const DARKENING = '#000000';

/** The background of each tone: two dark gradient stops, so light text stays readable over the whole strip, and black circles. */
export const StripTones: Readonly<Record<StripTone, StripBackgroundTone>> = {
	heat: { from: '#7C2D12', to: '#450A0A', decoration: DARKENING },
	cool: { from: '#1E40AF', to: '#172554', decoration: DARKENING },
	teal: { from: '#115E59', to: '#134E4A', decoration: DARKENING },
	neutral: { from: '#2B2B2B', to: '#151515', decoration: DARKENING },
};
