import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioTarget } from '../../audio/audio_target';
import { resolveAudioDevice } from '../../audio/resolve_audio_device';
import { KeyState } from '../keys/key_state';
import type { KeyStateValue } from '../keys/key_state_value';

/** Lights a "Default output" key while its device is the default output, and dims it while the device is unplugged or not picked. */
export function resolveDefaultOutputKeyState(
	snapshot: AudioSnapshot | undefined,
	target: AudioTarget | undefined
): KeyStateValue {
	const device =
		snapshot === undefined || target === undefined
			? undefined
			: resolveAudioDevice(snapshot, target);
	if (snapshot === undefined || device === undefined) {
		return KeyState.unavailable;
	}
	return snapshot.defaultDeviceIds.output === device.id
		? KeyState.on
		: KeyState.off;
}
