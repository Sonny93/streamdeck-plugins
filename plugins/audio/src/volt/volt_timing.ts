/** Timing of the link to the Volt 1. */
export const VoltTiming = {
	/** Delay before looking for the Volt 1 again after it was unplugged or could not be opened. */
	reconnectDelayMilliseconds: 2000,
	/** Number of failed attempts made at the short delay before the delay starts doubling. */
	fastReconnectAttempts: 5,
	/** The delay never grows past this while the Volt 1 stays absent. */
	maximumReconnectDelayMilliseconds: 30_000,
} as const;
