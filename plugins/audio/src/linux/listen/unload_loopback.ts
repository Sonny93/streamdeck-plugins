import type { ListenContext } from './listen_context';

/** Unloads a module by the index of a fresh read or of a load; never an index from elsewhere. */
export async function unloadLoopback(
	context: ListenContext,
	moduleIndex: number
): Promise<void> {
	await context.run({
		command: 'pactl',
		args: ['unload-module', String(moduleIndex)],
	});
}
