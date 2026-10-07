/** Cadence at which the lyrics watcher retries connecting to Spotify while it is unreachable. */
export const SpotifyLyricsWatchTiming = {
	reconnectIntervalMilliseconds: 3_000,
} as const;
