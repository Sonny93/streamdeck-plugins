import { AudioKeyState } from './audio_key_state';
import type { AudioTarget } from '../../audio/audio_target';
import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioKeyStateValue } from './audio_key_state_value';
import { resolveAudioDevice } from '../../audio/resolve_audio_device';

/** Lights a "Default output" key while its device is the default output, and dims it while the device is unplugged or not picked. */
export function resolveDefaultOutputKeyState(
	snapshot: AudioSnapshot | undefined,
	target: AudioTarget | undefined
): AudioKeyStateValue {
	const device =
		snapshot === undefined || target === undefined
			? undefined
			: resolveAudioDevice(snapshot, target);
	if (snapshot === undefined || device === undefined) {
		return AudioKeyState.unavailable;
	}
	return snapshot.defaultDeviceIds.output === device.id
		? AudioKeyState.on
		: AudioKeyState.off;
}
