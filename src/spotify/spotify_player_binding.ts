/** Names shared between the plugin and the script injected into Spotify to watch the player state. */
export const SpotifyPlayerBinding = {
	name: 'spotifyDeckPlayerState',
	guardProperty: '__spotifyDeckPlayerWatcher',
} as const;
