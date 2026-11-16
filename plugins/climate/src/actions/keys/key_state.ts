/**
 * Manifest state indexes of the keys of the plugin.
 * "On" means the unit is on on a "Power" key, the unit matches the preset on a "Preset" key,
 * and the unit blows (or swings, for a swing key) on a "Fan" key.
 */
export const KeyState = {
	off: 0,
	on: 1,
	unavailable: 2,
} as const;
