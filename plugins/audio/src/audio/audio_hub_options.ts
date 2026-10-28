import type { Scheduler } from '../shared/scheduler';
import type { CoreAudio } from './core_audio';

export type AudioHubOptions = Readonly<{
	loadCoreAudio: () => Promise<CoreAudio>;
	schedule: Scheduler;
	pollIntervalMilliseconds: number;
	volumeStep: number;
	/** Called when the devices cannot be read; the hub tries again at the next poll. */
	onError: (error: unknown) => void;
}>;
