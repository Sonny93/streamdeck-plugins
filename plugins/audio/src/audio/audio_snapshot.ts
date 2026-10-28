import type { AudioDevice } from './audio_device';
import type { AudioFlow } from './audio_flow';
import type { AudioVolume } from './audio_volume';

/** The audio devices of Windows at one moment: the active ones, the default one of each direction, and their volume. */
export type AudioSnapshot = Readonly<{
	devices: readonly AudioDevice[];
	defaultDeviceIds: Readonly<Record<AudioFlow, string | undefined>>;
	/** Volume by device id; a device whose volume cannot be read is missing. */
	volumes: Readonly<Record<string, AudioVolume>>;
}>;
