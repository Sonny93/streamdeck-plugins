import { SpotifyProcess } from './spotify_process';
import { waitForSpotifyExit } from './wait_for_spotify_exit';
import { ensureSpotifyRunning } from './ensure_spotify_running';
import { killProcessImage } from '../windows/kill_process_image';
import { SpotifyNotReachableError } from './spotify_not_reachable_error';
import { fetchBrowserWebSocketUrl } from './fetch_browser_web_socket_url';
import type { SpotifyDebugPortOutcome } from './spotify_debug_port_outcome';
import { isProcessImageRunning } from '../windows/is_process_image_running';

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

async function restartSpotifyWithDebugPort(): Promise<void> {
	await killProcessImage(SpotifyProcess.imageName);
	await waitForSpotifyExit();
	await ensureSpotifyRunning();
}

/**
 * Makes sure a running Spotify exposes its DevTools port: when Spotify runs without it, kills Spotify and relaunches it with the debug flag.
 * Does nothing when the port already answers or when Spotify is not running.
 */
export async function ensureSpotifyDebugPortOnStartup(): Promise<SpotifyDebugPortOutcome> {
	if (await isDebugPortOpen()) {
		return 'already-open';
	}
	if (!(await isProcessImageRunning(SpotifyProcess.imageName))) {
		return 'spotify-not-running';
	}
	await restartSpotifyWithDebugPort();
	return 'restarted';
}
