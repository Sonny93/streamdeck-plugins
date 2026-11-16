/** Delays of the "Climate" dial. */
export const DialTiming = {
	/** A dial held down this long cancels the temperature chosen instead of applying it. */
	holdMilliseconds: 600,
	/** A chosen temperature is cancelled after this long without a rotation. */
	idleMilliseconds: 10_000,
} as const;
