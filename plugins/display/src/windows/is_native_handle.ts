import type { NativePointer } from './native_pointer';

/** Tells whether a value koffi handed out is a non-null pointer. */
export function isNativeHandle(value: unknown): value is NativePointer {
	return typeof value === 'bigint' && value !== 0n;
}
