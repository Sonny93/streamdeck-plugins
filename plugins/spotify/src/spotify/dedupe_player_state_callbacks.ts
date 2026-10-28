import type { SpotifyPlayerState } from './spotify_player_state';
import type { PlayerStateWatchCallbacks } from './player_state_watch_callbacks';

function isSameState(
	first: SpotifyPlayerState | undefined,
	second: SpotifyPlayerState | undefined
): boolean {
	return JSON.stringify(first) === JSON.stringify(second);
}

/** Wraps callbacks so `onChange` only fires when the state changes and never after `signal` is aborted. */
export function dedupePlayerStateCallbacks(
	callbacks: PlayerStateWatchCallbacks,
	signal: AbortSignal
): PlayerStateWatchCallbacks {
	let hasReported = false;
	let lastReported: SpotifyPlayerState | undefined;
	return {
		onError: callbacks.onError,
		onChange: (state) => {
			if (signal.aborted || (hasReported && isSameState(state, lastReported))) {
				return;
			}
			hasReported = true;
			lastReported = state;
			callbacks.onChange(state);
		},
	};
}
