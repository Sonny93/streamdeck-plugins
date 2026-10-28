/** Polling cadence and deadlines used while waiting for Spotify to exit or for a freshly launched Spotify to be ready. */
export const SpotifyLaunchTiming = {
	pollIntervalMilliseconds: 250,
	timeoutMilliseconds: 15_000,
	exitTimeoutMilliseconds: 10_000,
} as const;
