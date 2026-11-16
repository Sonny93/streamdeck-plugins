/** Delays shared by every plugin with an idle panel on the touch strip. */
export const IdleTiming = {
	/** How long the dials must stay untouched, on a page, before the idle panel shows. */
	inactivityDelayMilliseconds: 5000,
	/** How long the dials must be left alone after a gesture that woke the panel, before the next event acts. */
	wakeQuietMilliseconds: 300,
} as const;
