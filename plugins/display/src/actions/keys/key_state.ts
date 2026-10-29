/**
 * Manifest state indexes of the keys of the plugin that show something on or off.
 * "On" means the screen is lit on a "Screen Power" key, HDR is on on an "HDR" key,
 * and the screen is at the brightness of the key on a "Brightness" key.
 */
export const KeyState = {
	off: 0,
	on: 1,
	unavailable: 2,
} as const;
