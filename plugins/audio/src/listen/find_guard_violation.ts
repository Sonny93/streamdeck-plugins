import { ListenCutReason } from './listen_cut_reason';
import type { ListenGuard } from './listen_guard';
import type { ListenSource } from './listen_source';
import { ListenTiming } from './listen_timing';

/** Tells why a listened source is no longer what its guard allows, `undefined` when it still is. */
export function findGuardViolation(
	guard: Readonly<ListenGuard>,
	source: ListenSource | undefined
): ListenCutReason | undefined {
	if (source === undefined) {
		return ListenCutReason.sourceGone;
	}
	if (source.loudestLevel > guard.allowedLevel + ListenTiming.levelTolerance) {
		return ListenCutReason.levelRaised;
	}
	if (guard.isPortKnown && source.activePort !== guard.port) {
		return ListenCutReason.portChanged;
	}
	return undefined;
}
