/** Polling cadence and deadline used while waiting for a freshly launched Spotify to be ready. */
export const SpotifyLaunchTiming = {
	pollIntervalMilliseconds: 250,
	timeoutMilliseconds: 15_000,
} as const;
