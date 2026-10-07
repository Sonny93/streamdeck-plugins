/** Cadence at which the Spotify watchers retry connecting to Spotify while it is unreachable. */
export const SpotifyWatchTiming = {
	reconnectIntervalMilliseconds: 3_000,
} as const;
