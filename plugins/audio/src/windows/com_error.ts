const HEX_RADIX = 16;
const UNSIGNED_SHIFT = 0;

function formatResult(result: unknown): string {
	return typeof result === 'number'
		? `HRESULT 0x${(result >>> UNSIGNED_SHIFT).toString(HEX_RADIX)}`
		: `result ${String(result)}`;
}

/** Raised when a COM call fails with an error HRESULT or hands out no object. */
export class ComError extends Error {
	readonly code = 'E_COM_CALL';
	override readonly name = 'ComError';

	constructor(options: Readonly<{ call: string; result: unknown }>) {
		super(`${options.call} failed with ${formatResult(options.result)}.`);
	}
}
