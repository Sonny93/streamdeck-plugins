import { REAR_MIC_ID } from './build_listen_source';
import type { Loopback } from './loopback';

/** A loopback of tests: loaded by hand on the rear mic, linked to it, streams at 100 %, unless overridden. */
export function buildLoopback(overrides: Partial<Loopback> = {}): Loopback {
	return {
		moduleIndex: 9,
		requestedSourceId: REAR_MIC_ID,
		linkedSourceId: REAR_MIC_ID,
		captureLevel: 1,
		playbackLevel: 1,
		isPluginLoopback: false,
		...overrides,
	};
}
