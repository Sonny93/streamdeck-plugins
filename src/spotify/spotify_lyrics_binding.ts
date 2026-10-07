/** Names shared between the plugin and the script injected into Spotify to watch lyrics availability. */
export const SpotifyLyricsBinding = {
	name: 'spotifyDeckLyricsAvailability',
	guardProperty: '__spotifyDeckLyricsWatcher',
} as const;
