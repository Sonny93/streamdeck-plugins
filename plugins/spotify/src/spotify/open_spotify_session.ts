import { CdpClient } from '../cdp/cdp_client';
import type { SpotifyRuntime } from './spotify_runtime';
import type { SpotifySession } from './spotify_session';
import { SpotifyLaunchTiming } from './spotify_launch_timing';
import { retryDuringColdStart } from './retry_during_cold_start';
import { fetchSpotifyPageTarget } from './fetch_spotify_page_target';
import { SpotifyPageNotFoundError } from './spotify_page_not_found_error';
import { SpotifyLaunchTimeoutError } from './spotify_launch_timeout_error';

/**
 * Opens the CDP connections to the Spotify UI page of an already reachable runtime.
 * The caller must close both clients of the returned session.
 */
export async function openSpotifySession(
	runtime: SpotifyRuntime
): Promise<SpotifySession> {
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
