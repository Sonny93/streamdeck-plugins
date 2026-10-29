import { onceAsync } from 'deck-kit/async/once_async';
import { loadKoffi } from 'deck-kit/windows/load_koffi';
import type koffiModule from 'koffi';

import { acquireOutPointer } from './acquire_out_pointer';
import { ComError } from './com_error';
import type { ComRuntime } from './com_runtime';
import { declareGuidType } from './declare_guid_type';
import type { Guid } from './guid';
import { parseGuid } from './parse_guid';

type Koffi = typeof koffiModule;
type Library = ReturnType<Koffi['load']>;

const RELEASE_SLOT = 2;
const POINTER_TYPE = 'void *';
const NO_RESERVED = null;
const NO_OUTER_OBJECT = null;
const MULTITHREADED_APARTMENT = 0x0;
const CHANGED_MODE_RESULT = 0x8001_0106;
const CLASS_CONTEXT_ALL = 0x17;
const UNSIGNED_SHIFT = 0;

/** Joins the multithreaded apartment; a thread that already joined the other apartment is fine too. */
function initializeCom(ole32: Library): void {
	const coInitializeEx = ole32.func(
		'int32 __stdcall CoInitializeEx(void *reserved, uint32 model)'
	);
	const result: unknown = coInitializeEx(NO_RESERVED, MULTITHREADED_APARTMENT);
	if (
		typeof result !== 'number' ||
		(result < 0 && result >>> UNSIGNED_SHIFT !== CHANGED_MODE_RESULT)
	) {
		throw new ComError({ call: 'CoInitializeEx', result });
	}
}

function declareComRuntime(koffi: Koffi): ComRuntime {
	declareGuidType(koffi);
	const ole32 = koffi.load('ole32.dll');
	initializeCom(ole32);
	const coCreateInstance = ole32.func(
		'int32 __stdcall CoCreateInstance(_In_ GUID *classId, void *outer, uint32 context, _In_ GUID *interfaceId, _Out_ void **object)'
	);
	const coTaskMemFree = ole32.func(
		'void __stdcall CoTaskMemFree(void *pointer)'
	);
	const propVariantClear = ole32.func(
		'int32 __stdcall PropVariantClear(void *value)'
	);
	const releasePrototype = koffi.proto(
		'uint32 __stdcall ComRelease(void *self)'
	);
	const guids = new Map<string, Guid>();
	const guidOf = (text: string): Guid => {
		const guid = guids.get(text) ?? parseGuid(text);
		guids.set(text, guid);
		return guid;
	};
	const method: ComRuntime['method'] = (object, slot, prototype) => {
		const vtable: unknown = koffi.decode(object, POINTER_TYPE);
		const target: unknown = koffi.decode(
			vtable,
			slot * koffi.sizeof(POINTER_TYPE),
			POINTER_TYPE
		);
		return (...args) => koffi.call(target, prototype, object, ...args);
	};
	return {
		koffi,
		method,
		guidOf,
		createInstance: (classId, interfaceId) =>
			acquireOutPointer('CoCreateInstance', (out) =>
				coCreateInstance(
					guidOf(classId),
					NO_OUTER_OBJECT,
					CLASS_CONTEXT_ALL,
					guidOf(interfaceId),
					out
				)
			),
		release: (object) => {
			method(object, RELEASE_SLOT, releasePrototype)();
		},
		takeTaskString: (pointer) => {
			try {
				return koffi.decode.string16(pointer);
			} finally {
				coTaskMemFree(pointer);
			}
		},
		clearPropVariant: (value) => {
			propVariantClear(value);
		},
	};
}

/** Loads koffi lazily, joins COM and binds the COM plumbing, once. */
export const loadComRuntime = onceAsync(async (): Promise<ComRuntime> =>
	declareComRuntime(await loadKoffi())
);
