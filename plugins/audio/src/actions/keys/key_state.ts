/**
 * Manifest state indexes of the keys of the plugin that show something on or off.
 * "On" means the device is the default output on a "Default Output" key, muted on a "Mute" key,
 * and the button is on for a Volt 1 key.
 */
export const KeyState = {
	off: 0,
	on: 1,
	unavailable: 2,
} as const;
