/** Timing of the "now playing" screen: how long the dials must stay untouched before they show it (keys do not count), and how often its progress bar moves. */
export const NowPlayingTiming = {
	inactivityDelayMilliseconds: 15_000,
	progressIntervalMilliseconds: 1_000,
} as const;
