/** Delays of the climate plugin: how often the unit is read, and how long a burst of requests waits before one write. */
export const ClimateTiming = {
	pollIntervalMilliseconds: 15_000,
	maximumPollIntervalMilliseconds: 60_000,
	energyIntervalMilliseconds: 600_000,
	energyRetryMilliseconds: 60_000,
	immediateQuietMilliseconds: 0,
	toggleQuietMilliseconds: 150,
	temperatureQuietMilliseconds: 400,
	fanRateQuietMilliseconds: 1000,
} as const;
