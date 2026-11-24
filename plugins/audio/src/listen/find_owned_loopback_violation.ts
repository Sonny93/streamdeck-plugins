import { ListenCutReason } from './listen_cut_reason';
import { ListenTiming } from './listen_timing';
import type { Loopback } from './loopback';

/** Tells why a loopback this plugin loaded no longer plays its source as it should, `undefined` when it still does. */
export function findOwnedLoopbackViolation(
	loopback: Loopback,
	sourceId: string
): ListenCutReason | undefined {
	if (loopback.linkedSourceId !== sourceId) {
		return ListenCutReason.loopbackRelinked;
	}
	const { captureLevel, playbackLevel } = loopback;
	if (captureLevel === undefined || playbackLevel === undefined) {
		return ListenCutReason.streamMissing;
	}
	const maximum = ListenTiming.maximumStreamLevel;
	if (captureLevel > maximum || playbackLevel > maximum) {
		return ListenCutReason.streamTooLoud;
	}
	return undefined;
}
