import type { ListenContext } from './listen_context';
import { ListenSourceNotAvailableError } from './listen_source_not_available_error';
import { readListenSources } from './read_listen_sources';

/** Throws unless a fresh listing of the hardware inputs holds the id; reads the sources only. */
export async function assertListenSource(
	context: ListenContext,
	sourceId: string
): Promise<void> {
	const sources = await readListenSources(context);
	if (!sources.some((candidate) => candidate.id === sourceId)) {
		throw new ListenSourceNotAvailableError(sourceId);
	}
}
