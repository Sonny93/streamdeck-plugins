const LAST_RED_INDEX = 255;
const FULL_LEVEL = 65_535;
const PERCENT = 100;

/** Reads the brightness a gamma ramp gives the picture, in percent, from the level it gives full red. */
export function readGammaBrightness(ramp: Uint16Array): number | undefined {
	const level = ramp[LAST_RED_INDEX];
	return level === undefined
		? undefined
		: Math.round((level / FULL_LEVEL) * PERCENT);
}
