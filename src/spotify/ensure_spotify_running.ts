import { launchSpotify } from './launch_spotify';
import type { SpotifyRuntime } from './spotify_runtime';
import { SpotifyLaunchTiming } from './spotify_launch_timing';
import { retryDuringColdStart } from './retry_during_cold_start';
import { SpotifyNotReachableError } from './spotify_not_reachable_error';
import { fetchBrowserWebSocketUrl } from './fetch_browser_web_socket_url';
import { SpotifyDebugPortUnavailableError } from './spotify_debug_port_unavailable_error';

function isNotReachable(error: unknown): boolean {
	return error instanceof SpotifyNotReachableError;
}

/**
 * Returns Spotify's browser websocket, launching Spotify with the debug flag when its port is closed.
 * Fails with a typed error when the port never opens, e.g. Spotify already runs without the debug flag.
 */
export async function ensureSpotifyRunning(): Promise<SpotifyRuntime> {
	try {
		return {
			browserWebSocketUrl: await fetchBrowserWebSocketUrl(),
			launchedByPlugin: false,
		};
	} catch (error) {
		if (!isNotReachable(error)) {
			throw error;
		}
	}
	await launchSpotify();
	const browserWebSocketUrl = await retryDuringColdStart({
		attempt: fetchBrowserWebSocketUrl,
		isRetryable: isNotReachable,
		isColdStart: true,
		createTimeoutError: (lastError) =>
			new SpotifyDebugPortUnavailableError({
				timeoutMilliseconds: SpotifyLaunchTiming.timeoutMilliseconds,
				cause: lastError,
			}),
	});
	return { browserWebSocketUrl, launchedByPlugin: true };
}
