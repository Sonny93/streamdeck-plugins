import type { ListenSource } from './listen_source';

/** What the keys and dials show of listening: the hardware inputs and which of them are played in the output. */
export type ListenView = Readonly<{
	sources: readonly ListenSource[];
	listenedSourceIds: ReadonlySet<string>;
}>;
