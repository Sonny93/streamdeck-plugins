import type { LyricsWatchCallbacks } from './lyrics_watch_callbacks';

/** Wraps callbacks so `onChange` only fires when the value changes and never after `signal` is aborted. */
export function dedupeLyricsCallbacks(
	callbacks: LyricsWatchCallbacks,
	signal: AbortSignal
): LyricsWatchCallbacks {
	let lastReported: boolean | undefined;
	return {
		onError: callbacks.onError,
		onChange: (isAvailable) => {
			if (signal.aborted || isAvailable === lastReported) {
				return;
			}
			lastReported = isAvailable;
			callbacks.onChange(isAvailable);
		},
	};
}
