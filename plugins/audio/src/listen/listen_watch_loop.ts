import type { Scheduler } from 'deck-kit/async/scheduler';

import type { AudioChangeWatcher } from '../audio/audio_change_watcher';
import { ListenTiming } from './listen_timing';

type ListenWatchLoopOptions = Readonly<{
	watchChanges: AudioChangeWatcher;
	schedule: Scheduler;
	/** Called on every change notice and every safety poll; reads that wait in line are merged by the caller. */
	onTick: () => void;
}>;

/** The change watcher and the safety poll of listening, started and stopped together. */
export class ListenWatchLoop {
	private cancelPoll: (() => void) | undefined;
	private stopWatching: (() => void) | undefined;

	constructor(private readonly options: ListenWatchLoopOptions) {}

	get isRunning(): boolean {
		return this.cancelPoll !== undefined;
	}

	start(): void {
		if (this.isRunning) {
			return;
		}
		this.armPoll();
		this.stopWatching = this.options.watchChanges(() => {
			this.options.onTick();
		});
	}

	stop(): void {
		this.cancelPoll?.();
		this.cancelPoll = undefined;
		this.stopWatching?.();
		this.stopWatching = undefined;
	}

	private armPoll(): void {
		this.cancelPoll = this.options.schedule(() => {
			this.armPoll();
			this.options.onTick();
		}, ListenTiming.safetyPollIntervalMilliseconds);
	}
}
