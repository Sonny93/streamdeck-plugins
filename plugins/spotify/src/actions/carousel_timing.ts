/** Timing of the carousel scroll: the delay between two frames, how fast the position closes on its target, and when it snaps. */
export const CarouselTiming = {
	frameIntervalMilliseconds: 33,
	easeFactor: 0.35,
	snapDistance: 0.01,
} as const;
