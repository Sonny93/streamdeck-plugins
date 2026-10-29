/** Timing of the display actions. */
export const DisplayTiming = {
	/** Delay between two reads of the monitors, so changes made outside the plugin show up; DDC/CI reads take ~50 ms each. */
	pollIntervalMilliseconds: 2000,
} as const;
