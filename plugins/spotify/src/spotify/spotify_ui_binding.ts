/** Names shared between the plugin and the script injected into Spotify to watch the state of its window. */
export const SpotifyUiBinding = {
	name: 'spotifyDeckUiState',
	guardProperty: '__spotifyDeckUiWatcher',
} as const;
