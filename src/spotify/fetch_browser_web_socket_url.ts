import { z } from 'zod';

import { fetchSpotifyJson } from './fetch_spotify_json';

const versionSchema = z.object({ webSocketDebuggerUrl: z.string() });

/** Resolves the browser-level websocket URL, which proves Spotify's DevTools port is open. */
export async function fetchBrowserWebSocketUrl(): Promise<string> {
	const version = await fetchSpotifyJson({
		path: '/json/version',
		schema: versionSchema,
	});
	return version.webSocketDebuggerUrl;
}
