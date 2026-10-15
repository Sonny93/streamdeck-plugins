import type { SpotifyUiState } from './spotify_ui_state';
import type { UiStateWatchCallbacks } from './ui_state_watch_callbacks';

function isSameState(
	first: SpotifyUiState | undefined,
	second: SpotifyUiState | undefined
): boolean {
	return JSON.stringify(first) === JSON.stringify(second);
}

/** Wraps callbacks so `onChange` only fires when the state changes and never after `signal` is aborted. */
export function dedupeUiStateCallbacks(
	callbacks: UiStateWatchCallbacks,
	signal: AbortSignal
): UiStateWatchCallbacks {
	let hasReported = false;
	let lastReported: SpotifyUiState | undefined;
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
