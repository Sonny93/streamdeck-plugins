/** The Spotify UI page target, ready to be attached to over its own websocket. */
export type SpotifyPageTarget = Readonly<{
	id: string;
	webSocketDebuggerUrl: string;
}>;
