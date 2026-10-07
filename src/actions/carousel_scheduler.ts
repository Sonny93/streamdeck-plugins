/** Runs a callback after a delay and returns the function that cancels it; injected so frames can be driven deterministically. */
export type CarouselScheduler = (
	callback: () => void,
	delayMilliseconds: number
) => () => void;
