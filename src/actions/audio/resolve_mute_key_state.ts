import { AudioKeyState } from './audio_key_state';
import type { AudioTarget } from '../../audio/audio_target';
import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioKeyStateValue } from './audio_key_state_value';
import { resolveAudioDevice } from '../../audio/resolve_audio_device';

/** Shows a "Mute" key as muted while its device is muted, and dims it while the device is unplugged. */
export function resolveMuteKeyState(
	snapshot: AudioSnapshot | undefined,
	target: AudioTarget | undefined
): AudioKeyStateValue {
	const device =
		snapshot === undefined || target === undefined
			? undefined
			: resolveAudioDevice(snapshot, target);
	const volume =
		device === undefined ? undefined : snapshot?.volumes[device.id];
	if (volume === undefined) {
		return AudioKeyState.unavailable;
	}
	return volume.isMuted ? AudioKeyState.on : AudioKeyState.off;
}
