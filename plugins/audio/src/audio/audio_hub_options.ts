import type { Scheduler } from 'deck-kit/async/scheduler';

import type { AudioChangeWatcher } from './audio_change_watcher';
import type { CoreAudio } from './core_audio';

export type AudioHubOptions = Readonly<{
	loadCoreAudio: () => Promise<CoreAudio>;
	schedule: Scheduler;
	/** Delay between two reads of the devices; with a watcher it only has to catch what the watcher misses. */
	pollIntervalMilliseconds: number;
	volumeStep: number;
	/** Reads the devices again as soon as the system says something changed, `undefined` when the platform cannot tell. */
	watchChanges?: AudioChangeWatcher;
	/** Time to wait after a change notice before reading, so a burst of notices makes one read. */
	changeDebounceMilliseconds: number;
	/** Called when the devices cannot be read; the hub tries again at the next poll. */
	onError: (error: unknown) => void;
}>;
