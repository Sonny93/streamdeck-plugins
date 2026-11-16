/** Timing and steps of the audio device actions. */
export const AudioTiming = {
	/** Delay between two reads of the devices on Windows, so changes made outside the plugin show up. */
	pollIntervalMilliseconds: 500,
	/** Delay between two reads on Linux, where the change watcher reports most changes and the poll is a safety net. */
	safetyPollIntervalMilliseconds: 5000,
	/** Delay before the change watcher of Linux starts again after its process ended, doubling up to the maximum. */
	watchRestartDelayMilliseconds: 1000,
	watchRestartMaxDelayMilliseconds: 30_000,
	/** Delay between two reads on a system the plugin does not support, where every read fails. */
	unsupportedPollIntervalMilliseconds: 60_000,
	/** Wait after a change notice before reading, so a burst of notices makes one read. */
	changeDebounceMilliseconds: 100,
	/** Volume change of one dial tick, the volume going from 0 to 1. */
	volumeStep: 0.02,
} as const;
