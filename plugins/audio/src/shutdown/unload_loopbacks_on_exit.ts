import type { SourceListening } from '../listen/source_listening';

const EXIT_SIGNALS = ['SIGTERM', 'SIGINT'] as const;

/**
 * Unloads the loopbacks the plugin loaded when the process ends, so a stopped plugin never leaves an input playing in the headphones.
 * SIGTERM and SIGINT are turned into `process.exit()` so the `exit` handler runs; neither the plugin nor the Stream Deck SDK handles them otherwise.
 */
export function unloadLoopbacksOnExit(
	options: Readonly<{
		listening: Pick<SourceListening, 'unloadLoopbacksNow'> | undefined;
		readOwnedModuleIndexes: () => readonly number[];
	}>
): void {
	const { listening, readOwnedModuleIndexes } = options;
	if (listening === undefined) {
		return;
	}
	process.once('exit', () => {
		listening.unloadLoopbacksNow(readOwnedModuleIndexes());
	});
	for (const signal of EXIT_SIGNALS) {
		process.once(signal, () => {
			process.exit();
		});
	}
}
