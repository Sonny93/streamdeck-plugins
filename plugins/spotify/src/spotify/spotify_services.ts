/** Names of the Spotify internal services the plugin talks to. */
export const SpotifyServices = {
	player: 'PlayerAPI',
	library: 'LibraryAPI',
	playlist: 'PlaylistAPI',
	rootlist: 'RootlistAPI',
	likedSongsUri: 'LibraryLikedSongsUri',
} as const;
