const HEX_RADIX = 16;
const UNSIGNED_SHIFT = 0;

/** Raised when a Windows Core Audio call fails with an error HRESULT. */
export class CoreAudioError extends Error {
	readonly code = 'E_CORE_AUDIO';
	override readonly name = 'CoreAudioError';

	constructor(options: Readonly<{ call: string; result: number }>) {
		super(
			`${options.call} failed with HRESULT 0x${(options.result >>> UNSIGNED_SHIFT).toString(HEX_RADIX)}.`
		);
	}
}
