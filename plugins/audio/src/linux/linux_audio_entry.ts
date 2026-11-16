import type { AudioDevice } from '../audio/audio_device';
import type { AudioVolume } from '../audio/audio_volume';

/** A device of a `pactl` listing with its volume, so one listing answers both questions. */
export type LinuxAudioEntry = Readonly<{
	device: AudioDevice;
	volume: AudioVolume;
}>;
