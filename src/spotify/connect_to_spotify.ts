import { CdpClient } from '../cdp/cdp_client';
import type { SpotifySession } from './spotify_session';
import { SpotifyLaunchTiming } from './spotify_launch_timing';
import { ensureSpotifyRunning } from './ensure_spotify_running';
import { retryDuringColdStart } from './retry_during_cold_start';
import { fetchSpotifyPageTarget } from './fetch_spotify_page_target';
import { SpotifyPageNotFoundError } from './spotify_page_not_found_error';
import { SpotifyLaunchTimeoutError } from './spotify_launch_timeout_error';

/**
 * Ensures Spotify runs with its DevTools port open (launching it if needed) and opens the CDP connections.
 * The caller must close both clients of the returned session.
 */
export async function connectToSpotify(): Promise<SpotifySession> {
	const runtime = await ensureSpotifyRunning();
	const pageTarget = await retryDuringColdStart({
		attempt: fetchSpotifyPageTarget,
		isRetryable: (error) => error instanceof SpotifyPageNotFoundError,
		isColdStart: runtime.launchedByPlugin,
		createTimeoutError: (lastError) =>
			new SpotifyLaunchTimeoutError({
				waitedFor: 'the Spotify UI window',
				timeoutMilliseconds: SpotifyLaunchTiming.timeoutMilliseconds,
				cause: lastError,
			}),
	});
	const browser = await CdpClient.connect(runtime.browserWebSocketUrl);
	try {
		const page = await CdpClient.connect(pageTarget.webSocketDebuggerUrl);
		return {
			browser,
			page,
			pageTargetId: pageTarget.id,
			launchedByPlugin: runtime.launchedByPlugin,
		};
	} catch (error) {
		browser.close();
		throw error;
	}
}
