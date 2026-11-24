import { runPactlJson } from 'deck-kit/linux/run_pactl_json';

import type { ListenSource } from '../../listen/listen_source';
import type { ListenContext } from './listen_context';
import { parseListenSources } from './parse_listen_sources';

/** Reads only the hardware inputs, fresh. */
export async function readListenSources(
	context: ListenContext
): Promise<ListenSource[]> {
	return parseListenSources(
		await runPactlJson({ args: ['list', 'sources'], runCommand: context.run })
	);
}
