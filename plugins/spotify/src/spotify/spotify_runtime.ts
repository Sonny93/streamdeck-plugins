/** A reachable Spotify DevTools endpoint and whether the plugin had to start Spotify to get it. */
export type SpotifyRuntime = Readonly<{
	browserWebSocketUrl: string;
	launchedByPlugin: boolean;
}>;
