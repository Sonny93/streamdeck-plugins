/**
 * Timing of the "now playing" screen: how often its progress bar moves,
 * and how long a change of lyric line is animated, at which frame interval.
 */
export const NowPlayingTiming = {
	progressIntervalMilliseconds: 1_000,
	lyricsTransitionMilliseconds: 350,
	lyricsFrameIntervalMilliseconds: 33,
} as const;
