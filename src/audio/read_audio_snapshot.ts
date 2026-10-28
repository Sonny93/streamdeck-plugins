import type { CoreAudio } from './core_audio';
import type { AudioVolume } from './audio_volume';
import type { AudioSnapshot } from './audio_snapshot';

/** Reads the active devices of both directions, the default ones and every volume. */
export function readAudioSnapshot(coreAudio: CoreAudio): AudioSnapshot {
	const devices = [
		...coreAudio.listDevices('output'),
		...coreAudio.listDevices('input'),
	];
	const volumes: Record<string, AudioVolume> = {};
	for (const device of devices) {
		try {
			volumes[device.id] = coreAudio.readVolume(device.id);
		} catch {
			// A device that went away since the listing has no volume.
		}
	}
	return {
		devices,
		defaultDeviceIds: {
			output: coreAudio.readDefaultDeviceId('output'),
			input: coreAudio.readDefaultDeviceId('input'),
		},
		volumes,
	};
}
