import { streamDeck } from '@elgato/streamdeck';

import type { SpotifyHost } from '../platform/spotify_host';
import { ensureSpotifyDebugPortOnStartup } from '../spotify/ensure_spotify_debug_port_on_startup';

/** Restarts a running Spotify with its DevTools port at plugin startup; failures are logged and never thrown. */
export async function prepareSpotifyOnStartup(
	host: SpotifyHost
): Promise<void> {
	try {
		const outcome = await ensureSpotifyDebugPortOnStartup(host);
		streamDeck.logger.info(`Spotify debug port check on startup: ${outcome}`);
	} catch (error) {
		streamDeck.logger.error('Cannot prepare Spotify on startup', error);
	}
}
