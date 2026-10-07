/** Raised when a native struct does not have the size the Win32 API expects, which would corrupt the call. */
export class Win32StructSizeError extends Error {
	readonly code = 'E_WIN32_STRUCT_SIZE';
	override readonly name = 'Win32StructSizeError';

	constructor(
		options: Readonly<{
			structName: string;
			expectedBytes: number;
			actualBytes: number;
		}>
	) {
		super(
			`${options.structName} is ${options.actualBytes} bytes, expected ${options.expectedBytes}.`
		);
	}
}
