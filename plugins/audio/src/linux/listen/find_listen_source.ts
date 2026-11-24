import type { ListenSource } from '../../listen/listen_source';
import type { ListenState } from '../../listen/listen_state';
import type { ListenContext } from './listen_context';
import { ListenSourceNotAvailableError } from './listen_source_not_available_error';
import { readListenState } from './read_listen_state';

/** Finds the id in a fresh listing of the hardware inputs, so no id reaches `pactl` unless the system lists it. */
export async function findListenSource(
	context: ListenContext,
	sourceId: string
): Promise<Readonly<{ source: ListenSource; state: ListenState }>> {
	const state = await readListenState(context);
	const source = state.sources.find((candidate) => candidate.id === sourceId);
	if (source === undefined) {
		throw new ListenSourceNotAvailableError(sourceId);
	}
	return { source, state };
}
