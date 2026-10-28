import { connectPlayerWatchSession } from './connect_player_watch_session';
import { dedupePlayerStateCallbacks } from './dedupe_player_state_callbacks';
import type { PlayerStateWatchCallbacks } from './player_state_watch_callbacks';
import type { PlayerStateWatcher } from './player_state_watcher';
import { runReconnectingWatchLoop } from './run_reconnecting_watch_loop';

/**
 * Watches the Spotify player state, pushing changes through `onChange`.
 * Spotify is never launched: while it is closed or unreachable the state is reported as `undefined`,
 * and the connection (not the player) is retried periodically until `stop` is called.
 */
export function watchPlayerState(
	callbacks: PlayerStateWatchCallbacks
): PlayerStateWatcher {
	const controller = new AbortController();
	const dedupedCallbacks = dedupePlayerStateCallbacks(
		callbacks,
		controller.signal
	);
	void runReconnectingWatchLoop(
		{
			connect: (onClosed) =>
				connectPlayerWatchSession(dedupedCallbacks, onClosed),
			onDisconnected: () => dedupedCallbacks.onChange(undefined),
			onError: dedupedCallbacks.onError,
		},
		controller.signal
	);
	return { stop: () => controller.abort() };
}
