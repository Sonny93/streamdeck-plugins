import type { Scheduler } from 'deck-kit/async/scheduler';

import type { AudioChangeWatcher } from '../audio/audio_change_watcher';
import { isRelevantPactlEvent } from './is_relevant_pactl_event';
import type { SpawnPactlSubscribeOptions } from './spawn_pactl_subscribe_options';

type PactlEventWatcherOptions = Readonly<{
	spawnSubscribe: (options: SpawnPactlSubscribeOptions) => () => void;
	schedule: Scheduler;
	initialBackoffMilliseconds: number;
	maxBackoffMilliseconds: number;
	/** Tells which lines of `pactl subscribe` report a change; the device and default device events when left out. */
	isRelevant?: (line: string) => boolean;
}>;

/**
 * Watches the audio devices through a supervised `pactl subscribe`: it runs while someone watches,
 * starts again with a growing delay when it ends, and reports a change after each restart since events may have been missed.
 */
export function createPactlEventWatcher(
	options: PactlEventWatcherOptions
): AudioChangeWatcher {
	return (onChange) => {
		const isRelevant = options.isRelevant ?? isRelevantPactlEvent;
		let isStopped = false;
		let backoffMilliseconds = options.initialBackoffMilliseconds;
		let stopProcess: (() => void) | undefined;
		let cancelRestart: (() => void) | undefined;

		const start = (): void => {
			stopProcess = options.spawnSubscribe({
				onLine: (line) => {
					backoffMilliseconds = options.initialBackoffMilliseconds;
					if (isRelevant(line)) {
						onChange();
					}
				},
				onExit: () => {
					if (isStopped) {
						return;
					}
					stopProcess = undefined;
					cancelRestart = options.schedule(() => {
						cancelRestart = undefined;
						start();
						onChange();
					}, backoffMilliseconds);
					backoffMilliseconds = Math.min(
						backoffMilliseconds * 2,
						options.maxBackoffMilliseconds
					);
				},
			});
		};

		start();
		return () => {
			isStopped = true;
			stopProcess?.();
			cancelRestart?.();
		};
	};
}
