/** Raised when the system refuses to open the vendor HID collection of the Volt 1. */
export class VoltOpenError extends Error {
	readonly code = 'E_VOLT_OPEN_FAILED';
	override readonly name = 'VoltOpenError';

	/** `reason` names the system error, such as `Win32 error 5` or `EACCES`. */
	constructor(reason: string, cause?: unknown) {
		super(`Cannot open the Volt 1 (${reason}).`, { cause });
	}
}
