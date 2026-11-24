/** Reported when a loopback tagged as this plugin's is loaded but the plugin does not own it (a failed start, a crash, a previous run): it is unloaded. */
export class ListenStrayLoopbackError extends Error {
	readonly code = 'E_LISTEN_STRAY_LOOPBACK';
	override readonly name = 'ListenStrayLoopbackError';

	constructor(readonly moduleIndex: number) {
		super(`Unloaded the stray loopback module ${moduleIndex}.`);
	}
}
