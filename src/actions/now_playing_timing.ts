/**
 * Timing of the "now playing" screen: how long the dials must stay untouched before they show it (keys do not count), how often its progress bar moves,
 * and how long a change of lyric line is animated, at which frame interval.
 */
export const NowPlayingTiming = {
	inactivityDelayMilliseconds: 15_000,
	progressIntervalMilliseconds: 1_000,
	lyricsTransitionMilliseconds: 350,
	lyricsFrameIntervalMilliseconds: 33,
} as const;
