import type koffiModule from 'koffi';

import type { Guid } from './guid';
import type { NativePointer } from './native_pointer';

type Koffi = typeof koffiModule;

/** A function prototype declared with `koffi.proto`. */
type ComPrototype = ReturnType<Koffi['proto']>;

/** The COM plumbing shared by the bindings of COM APIs. */
export type ComRuntime = Readonly<{
	koffi: Koffi;
	/** Binds the method at a vtable slot of a COM object (slots count the three `IUnknown` methods first). */
	method: (
		object: NativePointer,
		slot: number,
		prototype: ComPrototype
	) => (...args: unknown[]) => unknown;
	createInstance: (classId: string, interfaceId: string) => NativePointer;
	guidOf: (text: string) => Guid;
	release: (object: NativePointer) => void;
	/** Reads a UTF-16 string the callee allocated with the COM allocator, then frees it. */
	takeTaskString: (pointer: NativePointer) => string;
	clearPropVariant: (value: Uint8Array) => void;
}>;
