/** What the Spotify window shows: whether the track has lyrics and they are open, whether it is in full screen, whether the search is open, and whether the window has the focus. */
export type SpotifyUiState = Readonly<{
	isLyricsAvailable: boolean;
	isLyricsOpen: boolean;
	isFullscreen: boolean;
	isSearchOpen: boolean;
	isFocused: boolean;
}>;
