import type { Loopback } from '../../listen/loopback';
import { isLoopbackOfSource } from './is_loopback_of_source';

/** The loopback that already serves the source: the first one the plugin loaded, else the first one. */
export function pickExistingLoopback(
	loopbacks: readonly Loopback[],
	sourceId: string
): Loopback | undefined {
	const candidates = loopbacks.filter((loopback) =>
		isLoopbackOfSource(loopback, sourceId)
	);
	return (
		candidates.find((loopback) => loopback.isPluginLoopback) ?? candidates[0]
	);
}
