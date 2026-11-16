import type { AudioTarget } from './audio_target';

/** Stable text that is equal for two targets pointing at the same device or the same default, used to group changes. */
export function describeAudioTarget(target: AudioTarget): string {
	return target.kind === 'default'
		? `default:${target.flow}`
		: `device:${target.deviceId}`;
}
