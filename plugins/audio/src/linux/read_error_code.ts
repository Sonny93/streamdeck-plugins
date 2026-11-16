const UNKNOWN_ERROR_CODE = 'unknown error';

/** Reads the `code` of a Node system error, such as `EACCES`. */
export function readErrorCode(error: unknown): string {
	if (typeof error !== 'object' || error === null) {
		return UNKNOWN_ERROR_CODE;
	}
	const code: unknown = Reflect.get(error, 'code');
	return typeof code === 'string' ? code : UNKNOWN_ERROR_CODE;
}
