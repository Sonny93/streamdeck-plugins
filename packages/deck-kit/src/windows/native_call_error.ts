/** Raised when koffi cannot run a native function on its worker thread. */
export class NativeCallError extends Error {
	readonly code = 'E_NATIVE_CALL';
	override readonly name = 'NativeCallError';

	constructor(options: Readonly<{ cause: unknown }>) {
		super('A native call on a koffi worker thread failed.', {
			cause: options.cause,
		});
	}
}
