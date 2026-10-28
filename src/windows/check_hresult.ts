import { ComError } from './com_error';

/** Throws a `ComError` unless a COM call returned a success HRESULT (zero or positive). */
export function checkHresult(call: string, result: unknown): void {
	if (typeof result !== 'number' || result < 0) {
		throw new ComError({ call, result });
	}
}
