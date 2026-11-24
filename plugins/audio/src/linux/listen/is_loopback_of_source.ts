import type { Loopback } from '../../listen/loopback';

/** A loopback belongs to a source when it asks for it in its argument or its capture stream is linked to it. */
export function isLoopbackOfSource(
	loopback: Loopback,
	sourceId: string
): boolean {
	return (
		loopback.requestedSourceId === sourceId ||
		loopback.linkedSourceId === sourceId
	);
}
