/** Timing and steps of the audio device actions. */
export const AudioTiming = {
	/** Delay between two reads of the devices, so changes made outside the plugin show up. */
	pollIntervalMilliseconds: 500,
	/** Volume change of one dial tick, the volume going from 0 to 1. */
	volumeStep: 0.02,
} as const;
