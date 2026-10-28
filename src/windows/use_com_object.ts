import type { ComRuntime } from './com_runtime';
import type { NativePointer } from './native_pointer';

/** Runs `use` with a COM object, then releases the object whatever happens. */
export function useComObject<TResult>(
	runtime: Pick<ComRuntime, 'release'>,
	object: NativePointer,
	use: (object: NativePointer) => TResult
): TResult {
	try {
		return use(object);
	} finally {
		runtime.release(object);
	}
}
