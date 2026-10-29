const CHANNEL_LENGTH = 256;
const CHANNEL_COUNT = 3;
const IDENTITY_STEP = 257;
const PERCENT = 100;

/** Builds a linear gamma ramp (red, green, blue) that scales the picture to a brightness, in percent. */
export function buildGammaRamp(brightness: number): Uint16Array {
	const scale = brightness / PERCENT;
	const ramp = new Uint16Array(CHANNEL_LENGTH * CHANNEL_COUNT);
	for (let index = 0; index < ramp.length; index += 1) {
		ramp[index] = Math.round((index % CHANNEL_LENGTH) * IDENTITY_STEP * scale);
	}
	return ramp;
}
