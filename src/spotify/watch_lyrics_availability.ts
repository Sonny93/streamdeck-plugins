import type { LyricsWatcher } from './lyrics_watcher';
import { dedupeLyricsCallbacks } from './dedupe_lyrics_callbacks';
import type { LyricsWatchCallbacks } from './lyrics_watch_callbacks';
import { runReconnectingWatchLoop } from './run_reconnecting_watch_loop';
import { connectLyricsWatchSession } from './connect_lyrics_watch_session';

/**
 * Watches whether the current track has lyrics, pushing changes through `onChange`.
 * Spotify is never launched: while it is closed or unreachable the lyrics are reported unavailable,
 * and the connection (not the DOM) is retried periodically until `stop` is called.
 */
export function watchLyricsAvailability(
	callbacks: LyricsWatchCallbacks
): LyricsWatcher {
	const controller = new AbortController();
	const dedupedCallbacks = dedupeLyricsCallbacks(callbacks, controller.signal);
	void runReconnectingWatchLoop(
		{
			connect: (onClosed) =>
				connectLyricsWatchSession(dedupedCallbacks, onClosed),
			onDisconnected: () => dedupedCallbacks.onChange(false),
			onError: dedupedCallbacks.onError,
		},
		controller.signal
	);
	return { stop: () => controller.abort() };
}
