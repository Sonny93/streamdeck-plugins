import { clampAudioLevel } from './clamp_audio_level';
import type { CoreAudio } from './core_audio';
import { readAudioSnapshot } from './read_audio_snapshot';
import type { SyncCoreAudio } from './sync_core_audio';

/** Turns the synchronous Windows calls into the async `CoreAudio`; the toggle reads then sets inside one call, so nothing runs between the two. */
export function makeAsyncCoreAudio(syncAudio: SyncCoreAudio): CoreAudio {
	const coreAudio: Omit<CoreAudio, 'readSnapshot'> = {
		listDevices: async (flow) => syncAudio.listDevices(flow),
		readDefaultDeviceId: async (flow) => syncAudio.readDefaultDeviceId(flow),
		readVolume: async (deviceId) => syncAudio.readVolume(deviceId),
		setVolume: async (deviceId, level) => {
			syncAudio.setVolume(deviceId, level);
		},
		moveVolume: async (deviceId, delta) => {
			const volume = syncAudio.readVolume(deviceId);
			syncAudio.setVolume(deviceId, clampAudioLevel(volume.level + delta));
			if (volume.isMuted) {
				syncAudio.setMute(deviceId, false);
			}
		},
		setMute: async (deviceId, isMuted) => {
			syncAudio.setMute(deviceId, isMuted);
		},
		toggleMute: async (deviceId) => {
			syncAudio.setMute(deviceId, !syncAudio.readVolume(deviceId).isMuted);
		},
		setDefaultDevice: async (deviceId) => {
			syncAudio.setDefaultDevice(deviceId);
		},
	};
	return { ...coreAudio, readSnapshot: () => readAudioSnapshot(coreAudio) };
}
