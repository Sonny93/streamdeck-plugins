import type { ListenSource } from './listen_source';
import type { Loopback } from './loopback';

/** What one read of the system tells about listening: the hardware inputs and every loaded loopback. */
export type ListenState = Readonly<{
	sources: readonly ListenSource[];
	loopbacks: readonly Loopback[];
}>;
