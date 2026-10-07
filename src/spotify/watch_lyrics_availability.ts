import type { LyricsWatcher } from './lyrics_watcher';
import { runLyricsWatchLoop } from './run_lyrics_watch_loop';
import { dedupeLyricsCallbacks } from './dedupe_lyrics_callbacks';
import type { LyricsWatchCallbacks } from './lyrics_watch_callbacks';

/**
 * Watches whether the current track has lyrics, pushing changes through `onChange`.
 * Spotify is never launched: while it is closed or unreachable the lyrics are reported unavailable,
 * and the connection (not the DOM) is retried periodically until `stop` is called.
 */
export function watchLyricsAvailability(
	callbacks: LyricsWatchCallbacks
): LyricsWatcher {
	const controller = new AbortController();
	void runLyricsWatchLoop(
		dedupeLyricsCallbacks(callbacks, controller.signal),
		controller.signal
	);
	return { stop: () => controller.abort() };
}
