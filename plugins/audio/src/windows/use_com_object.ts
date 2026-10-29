import type { NativePointer } from 'deck-kit/windows/native_pointer';

import type { ComRuntime } from './com_runtime';

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
