import { connectUiWatchSession } from './connect_ui_watch_session';
import { dedupeUiStateCallbacks } from './dedupe_ui_state_callbacks';
import { runReconnectingWatchLoop } from './run_reconnecting_watch_loop';
import type { UiStateWatchCallbacks } from './ui_state_watch_callbacks';
import type { UiStateWatcher } from './ui_state_watcher';

/**
 * Watches the state of the Spotify window (lyrics, full screen, search, focus), pushing changes through `onChange`.
 * Spotify is never launched: while it is closed or unreachable the state is reported as `undefined`,
 * and the connection (not the DOM) is retried periodically until `stop` is called.
 */
export function watchUiState(callbacks: UiStateWatchCallbacks): UiStateWatcher {
	const controller = new AbortController();
	const dedupedCallbacks = dedupeUiStateCallbacks(callbacks, controller.signal);
	void runReconnectingWatchLoop(
		{
			connect: (onClosed) => connectUiWatchSession(dedupedCallbacks, onClosed),
			onDisconnected: () => dedupedCallbacks.onChange(undefined),
			onError: dedupedCallbacks.onError,
		},
		controller.signal
	);
	return { stop: () => controller.abort() };
}
