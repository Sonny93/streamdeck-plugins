import type { AudioSnapshot } from '../../audio/audio_snapshot';
import type { AudioTarget } from '../../audio/audio_target';
import { resolveAudioDevice } from '../../audio/resolve_audio_device';
import type { VolumeDialFeedback } from './volume_dial_feedback';

const PERCENT = 100;
const ACTIVE_OPACITY = 1;
const MUTED_OPACITY = 0.4;

/** Shows the device of a "Volume" dial with its volume, the bar faded while muted, or why there is nothing to show. */
export function buildVolumeDialFeedback(
	snapshot: AudioSnapshot | undefined,
	target: AudioTarget
): VolumeDialFeedback {
	const device =
		snapshot === undefined ? undefined : resolveAudioDevice(snapshot, target);
	const volume =
		device === undefined ? undefined : snapshot?.volumes[device.id];
	if (device === undefined || volume === undefined) {
		return {
			title: 'Volume',
			value: 'No device',
			indicator: { value: 0, opacity: MUTED_OPACITY },
		};
	}
	const percent = Math.round(volume.level * PERCENT);
	return {
		title: device.name,
		value: volume.isMuted ? 'Muted' : `${percent} %`,
		indicator: {
			value: percent,
			opacity: volume.isMuted ? MUTED_OPACITY : ACTIVE_OPACITY,
		},
	};
}
