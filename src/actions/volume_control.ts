/** Tuning of the "Volume" dials: the volume step of one dial tick, how often the shown volume is re-read, and the executable of Spotify. */
export const VolumeControl = {
	step: 0.02,
	refreshIntervalMilliseconds: 1_000,
	spotifyImageName: 'Spotify.exe',
} as const;
