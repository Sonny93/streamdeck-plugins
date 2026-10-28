import { checkHresult } from './check_hresult';
import { ComError } from './com_error';
import type { NativePointer } from './native_pointer';

const NULL_POINTER = 0n;

/** Calls a COM method that hands a pointer out through its last argument, and returns that pointer; throws when the call fails or hands out null. */
export function acquireOutPointer(
	call: string,
	invoke: (out: unknown[]) => unknown
): NativePointer {
	const out: unknown[] = [null];
	const result = invoke(out);
	checkHresult(call, result);
	const [pointer] = out;
	if (typeof pointer !== 'bigint' || pointer === NULL_POINTER) {
		throw new ComError({ call, result });
	}
	return pointer;
}
