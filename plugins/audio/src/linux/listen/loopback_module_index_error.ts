/** Raised when `pactl load-module` prints something other than the index of the new module. */
export class LoopbackModuleIndexError extends Error {
	readonly code = 'E_LISTEN_MODULE_INDEX';
	override readonly name = 'LoopbackModuleIndexError';

	constructor() {
		super('pactl printed an unexpected module index.');
	}
}
