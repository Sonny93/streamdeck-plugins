import { setTimeout as sleep } from 'node:timers/promises';

import type { CdpClient } from '../cdp/cdp_client';
import { SpotifyWatchTiming } from './spotify_watch_timing';

type WatchLoopOptions = Readonly<{
	connect: (onClosed: () => void) => Promise<CdpClient>;
	onDisconnected: () => void;
	onError: (error: unknown) => void;
}>;

async function watchOnce(
	options: WatchLoopOptions,
	signal: AbortSignal
): Promise<void> {
	try {
		const closed = Promise.withResolvers<void>();
		const client = await options.connect(closed.resolve);
		signal.addEventListener('abort', () => client.close(), { once: true });
		if (signal.aborted) {
			client.close();
		}
		await closed.promise;
	} catch (error) {
		options.onError(error);
	}
}

async function waitBeforeRetry(signal: AbortSignal): Promise<void> {
	const options = { signal };
	try {
		await sleep(
			SpotifyWatchTiming.reconnectIntervalMilliseconds,
			undefined,
			options
		);
	} catch {
		return;
	}
}

/**
 * Connects, watches until the connection drops, reports the disconnection, waits, and starts over.
 * Runs until `signal` is aborted. The only error swallowed is the abort interrupting the wait.
 */
export async function runReconnectingWatchLoop(
	options: WatchLoopOptions,
	signal: AbortSignal
): Promise<void> {
	while (!signal.aborted) {
		await watchOnce(options, signal);
		options.onDisconnected();
		await waitBeforeRetry(signal);
	}
}
