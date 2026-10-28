import type { AudioDevice } from './audio_device';
import type { AudioTarget } from './audio_target';
import type { AudioSnapshot } from './audio_snapshot';

/** Finds the active device a target points to, `undefined` when it is unplugged or there is no default one. */
export function resolveAudioDevice(
	snapshot: AudioSnapshot,
	target: AudioTarget
): AudioDevice | undefined {
	const deviceId =
		target.kind === 'default'
			? snapshot.defaultDeviceIds[target.flow]
			: target.deviceId;
	return snapshot.devices.find((device) => device.id === deviceId);
}
