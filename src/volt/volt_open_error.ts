/** Raised when Windows refuses to open the vendor HID collection of the Volt 1. */
export class VoltOpenError extends Error {
	readonly code = 'E_VOLT_OPEN_FAILED';
	override readonly name = 'VoltOpenError';

	constructor(win32Error: number) {
		super(`Cannot open the Volt 1 (Win32 error ${win32Error}).`);
	}
}
