/** Timing of the "Playlists" dial: how old the cached playlist list may get before a rotation refreshes it. */
export const PlaylistsDialTiming = {
	cacheMaxAgeMilliseconds: 60_000,
} as const;
