import { ListenCutReason } from './listen_cut_reason';
import { ListenTiming } from './listen_timing';
import type { Loopback } from './loopback';

/** Tells why a loopback loaded by hand is unsafe to leave playing, `undefined` when it looks fine. */
export function findHandLoopbackViolation(
	loopback: Loopback
): ListenCutReason | undefined {
	const { requestedSourceId, linkedSourceId, captureLevel, playbackLevel } =
		loopback;
	if (
		requestedSourceId !== undefined &&
		linkedSourceId !== undefined &&
		requestedSourceId !== linkedSourceId
	) {
		return ListenCutReason.loopbackRelinked;
	}
	const maximum = ListenTiming.maximumStreamLevel;
	if ((captureLevel ?? 0) > maximum || (playbackLevel ?? 0) > maximum) {
		return ListenCutReason.streamTooLoud;
	}
	return undefined;
}
