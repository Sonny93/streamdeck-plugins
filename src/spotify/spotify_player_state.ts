/** What the plugin knows about Spotify playback: whether it is paused and which track is loaded, if any. */
export type SpotifyPlayerState = Readonly<{
	isPaused: boolean;
	trackUri: string | undefined;
}>;
