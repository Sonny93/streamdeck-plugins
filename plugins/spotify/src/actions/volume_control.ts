/** Tuning of the "Volume" dials: the volume step of one dial tick, and how often the shown volume is re-read. */
export const VolumeControl = {
	step: 0.02,
	refreshIntervalMilliseconds: 1_000,
} as const;
