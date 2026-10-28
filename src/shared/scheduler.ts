/** Runs a callback after a delay and returns the function that cancels it; injected so timers can be driven deterministically. */
export type Scheduler = (
	callback: () => void,
	delayMilliseconds: number
) => () => void;
