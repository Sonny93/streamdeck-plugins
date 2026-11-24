import { findListenSource } from './find_listen_source';
import type { ListenContext } from './listen_context';
import { loadVerifiedLoopback } from './load_verified_loopback';
import { pickExistingLoopback } from './pick_existing_loopback';
import { setSourceLevel } from './set_source_level';

/**
 * Sets the level of the source first, so a level that does not apply stops everything before a loopback is loaded,
 * then loads one unless the source already has one. Resolves with the module index of a plugin loopback,
 * and `undefined` when only a loopback the plugin did not load serves the source: it is never claimed.
 */
export async function startListening(
	context: ListenContext,
	sourceId: string,
	level: number
): Promise<number | undefined> {
	await setSourceLevel(context, sourceId, level);
	const { state } = await findListenSource(context, sourceId);
	const existing = pickExistingLoopback(state.loopbacks, sourceId);
	if (existing !== undefined) {
		return existing.isPluginLoopback ? existing.moduleIndex : undefined;
	}
	return loadVerifiedLoopback(
		context,
		sourceId,
		new Set(state.loopbacks.map((loopback) => loopback.moduleIndex))
	);
}
