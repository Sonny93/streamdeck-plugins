import type { ListenContext } from './listen_context';
import { loadLoopback } from './load_loopback';
import { readListenState } from './read_listen_state';
import { unloadLoopback } from './unload_loopback';
import { verifyLoopback } from './verify_loopback';

/** Unloads the loopbacks that were not there before a load that threw and that are the plugin's or ask for the source, since the module may have loaded all the same. */
async function unloadStrayLoopbacks(
	context: ListenContext,
	sourceId: string,
	knownModuleIndexes: ReadonlySet<number>
): Promise<void> {
	const state = await readListenState(context);
	const strays = state.loopbacks.filter(
		(loopback) =>
			!knownModuleIndexes.has(loopback.moduleIndex) &&
			(loopback.isPluginLoopback || loopback.requestedSourceId === sourceId)
	);
	await Promise.all(
		strays.map((loopback) => unloadLoopback(context, loopback.moduleIndex))
	);
}

async function loadOrUnloadStrays(
	context: ListenContext,
	sourceId: string,
	knownModuleIndexes: ReadonlySet<number>
): Promise<number> {
	try {
		return await loadLoopback(context, sourceId);
	} catch (error) {
		await unloadStrayLoopbacks(context, sourceId, knownModuleIndexes);
		throw error;
	}
}

/**
 * Loads a loopback of the source, then checks it; a loopback that fails the check, or that cannot be checked, is unloaded before the error goes on.
 * `knownModuleIndexes` are the loopbacks that were loaded before this call. Resolves with the module index of the loopback.
 */
export async function loadVerifiedLoopback(
	context: ListenContext,
	sourceId: string,
	knownModuleIndexes: ReadonlySet<number>
): Promise<number> {
	const moduleIndex = await loadOrUnloadStrays(
		context,
		sourceId,
		knownModuleIndexes
	);
	try {
		await verifyLoopback(context, moduleIndex, sourceId);
		return moduleIndex;
	} catch (error) {
		await unloadLoopback(context, moduleIndex);
		throw error;
	}
}
