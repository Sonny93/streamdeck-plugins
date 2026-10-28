import type { AudioFlow } from './audio_flow';
import type { AudioDevice } from './audio_device';

/** Test factory: an active device whose name derives from its id. */
export function buildAudioDevice(
	id: string,
	flow: AudioFlow = 'output'
): AudioDevice {
	return { id, name: `Device ${id}`, flow };
}
