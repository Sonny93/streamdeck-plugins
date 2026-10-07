import { setTimeout as sleep } from 'node:timers/promises';

import type { LyricsWatchCallbacks } from './lyrics_watch_callbacks';
import { SpotifyLyricsWatchTiming } from './spotify_lyrics_watch_timing';
import { connectLyricsWatchSession } from './connect_lyrics_watch_session';

async function watchOnce(
	callbacks: LyricsWatchCallbacks,
	signal: AbortSignal
): Promise<void> {
	try {
		const closed = Promise.withResolvers<void>();
		const client = await connectLyricsWatchSession(callbacks, closed.resolve);
		signal.addEventListener('abort', () => client.close(), { once: true });
		if (signal.aborted) {
			client.close();
		}
		await closed.promise;
	} catch (error) {
		callbacks.onError(error);
	}
}

async function waitBeforeRetry(signal: AbortSignal): Promise<void> {
	const options = { signal };
	try {
		await sleep(
			SpotifyLyricsWatchTiming.reconnectIntervalMilliseconds,
			undefined,
			options
		);
	} catch {
		return;
	}
}

/**
 * Connects, watches until the connection drops, reports lyrics unavailable, waits, and starts over.
 * Runs until `signal` is aborted. The only error swallowed is the abort interrupting the wait.
 */
export async function runLyricsWatchLoop(
	callbacks: LyricsWatchCallbacks,
	signal: AbortSignal
): Promise<void> {
	while (!signal.aborted) {
		await watchOnce(callbacks, signal);
		callbacks.onChange(false);
		await waitBeforeRetry(signal);
	}
}
