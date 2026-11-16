import type { SpotifyHost } from '../platform/spotify_host';
import { ensureSpotifyRunning } from './ensure_spotify_running';
import { fetchBrowserWebSocketUrl } from './fetch_browser_web_socket_url';
import type { SpotifyDebugPortOutcome } from './spotify_debug_port_outcome';
import { SpotifyNotReachableError } from './spotify_not_reachable_error';
import { waitForSpotifyExit } from './wait_for_spotify_exit';

async function isDebugPortOpen(): Promise<boolean> {
	try {
		await fetchBrowserWebSocketUrl();
		return true;
	} catch (error) {
		if (error instanceof SpotifyNotReachableError) {
			return false;
		}
		throw error;
	}
}

async function restartSpotifyWithDebugPort(host: SpotifyHost): Promise<void> {
	await host.killSpotify();
	await waitForSpotifyExit(host);
	await ensureSpotifyRunning(host);
}

/**
 * Makes sure a running Spotify exposes its DevTools port: when Spotify runs without it, kills Spotify and relaunches it with the debug flag.
 * Does nothing when the port already answers or when Spotify is not running.
 */
export async function ensureSpotifyDebugPortOnStartup(
	host: SpotifyHost
): Promise<SpotifyDebugPortOutcome> {
	if (await isDebugPortOpen()) {
		return 'already-open';
	}
	if (!(await host.isSpotifyRunning())) {
		return 'spotify-not-running';
	}
	await restartSpotifyWithDebugPort(host);
	return 'restarted';
}
