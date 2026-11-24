import { isLoopbackOfSource } from './is_loopback_of_source';
import type { ListenContext } from './listen_context';
import { readListenState } from './read_listen_state';
import { unloadLoopback } from './unload_loopback';

/** Unloads every loopback of the source found in a fresh read, by request or by link; the other modules stay loaded. */
export async function stopListening(
	context: ListenContext,
	sourceId: string
): Promise<void> {
	const state = await readListenState(context);
	const loopbacks = state.loopbacks.filter((loopback) =>
		isLoopbackOfSource(loopback, sourceId)
	);
	await Promise.all(
		loopbacks.map((loopback) => unloadLoopback(context, loopback.moduleIndex))
	);
}
