/** Raised when a monitor does not take a value sent over DDC/CI, or has no DDC/CI. */
export class DdcWriteError extends Error {
	readonly code = 'E_DDC_WRITE';
	override readonly name = 'DdcWriteError';

	constructor(options: Readonly<{ vcpCode: number }>) {
		super(
			`The monitor did not take VCP 0x${options.vcpCode.toString(16).toUpperCase()}.`
		);
	}
}
