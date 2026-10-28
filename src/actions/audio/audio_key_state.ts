/** Manifest state indexes of the audio device keys: "on" means the device is the default output on a "Default Output" key, and muted on a "Mute" key. */
export const AudioKeyState = {
	off: 0,
	on: 1,
	unavailable: 2,
} as const;
