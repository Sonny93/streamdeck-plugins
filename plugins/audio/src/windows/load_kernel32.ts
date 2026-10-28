import type koffiModule from 'koffi';

import { onceAsync } from '../shared/once_async';
import type { FileHandle } from './file_handle';
import type { Kernel32 } from './kernel32';
import { loadKoffi } from './load_koffi';
import { NativeCallError } from './native_call_error';
import { Win32Constants } from './win32_constants';

type Koffi = typeof koffiModule;
type Library = ReturnType<Koffi['load']>;
type NativeFunction = ReturnType<Library['func']>;

const NO_SECURITY_ATTRIBUTES = null;
const NO_TEMPLATE_FILE = null;
const NO_OVERLAPPED = null;

function isOpenHandle(value: unknown): value is FileHandle {
	return (
		typeof value === 'bigint' &&
		value !== Win32Constants.invalidHandle &&
		value !== Win32Constants.nullHandle
	);
}

/** Runs a native function on a koffi worker thread, so a blocking call does not freeze the plugin. */
function callOnWorker(
	nativeFunction: NativeFunction,
	...args: unknown[]
): Promise<unknown> {
	return new Promise((resolve, reject) => {
		nativeFunction.async(...args, (error: unknown, result: unknown) => {
			if (error === null || error === undefined) {
				resolve(result);
				return;
			}
			reject(new NativeCallError({ cause: error }));
		});
	});
}

function bindCreateFile(library: Library): Kernel32['createFile'] {
	const createFile = library.func(
		'void *__stdcall CreateFileW(str16 path, uint32 access, uint32 shareMode, void *securityAttributes, uint32 creationDisposition, uint32 flags, void *templateFile)'
	);
	return (path, access) => {
		const handle: unknown = createFile(
			path,
			access,
			Win32Constants.fileShareReadWrite,
			NO_SECURITY_ATTRIBUTES,
			Win32Constants.openExisting,
			Win32Constants.noFileFlags,
			NO_TEMPLATE_FILE
		);
		return isOpenHandle(handle) ? handle : undefined;
	};
}

function bindReadFile(library: Library): Kernel32['readFile'] {
	const readFile = library.func(
		'bool __stdcall ReadFile(void *handle, _Out_ uint8 *buffer, uint32 size, _Out_ uint32 *bytesRead, void *overlapped)'
	);
	return async (handle, buffer) => {
		const bytesRead = [0];
		const isRead = await callOnWorker(
			readFile,
			handle,
			buffer,
			buffer.byteLength,
			bytesRead,
			NO_OVERLAPPED
		);
		return isRead === true ? bytesRead[0] : undefined;
	};
}

function bindWriteFile(library: Library): Kernel32['writeFile'] {
	const writeFile = library.func(
		'bool __stdcall WriteFile(void *handle, const uint8 *buffer, uint32 size, _Out_ uint32 *bytesWritten, void *overlapped)'
	);
	return async (handle, buffer) => {
		const bytesWritten = [0];
		const isWritten = await callOnWorker(
			writeFile,
			handle,
			buffer,
			buffer.byteLength,
			bytesWritten,
			NO_OVERLAPPED
		);
		return isWritten === true && bytesWritten[0] === buffer.byteLength;
	};
}

function declareKernel32(koffi: Koffi): Kernel32 {
	const library = koffi.load('kernel32.dll');
	const closeHandle = library.func('bool __stdcall CloseHandle(void *handle)');
	const getLastError = library.func('uint32 __stdcall GetLastError()');
	return {
		createFile: bindCreateFile(library),
		readFile: bindReadFile(library),
		writeFile: bindWriteFile(library),
		closeHandle: (handle) => {
			closeHandle(handle);
		},
		getLastError: () => {
			const error: unknown = getLastError();
			return typeof error === 'number' ? error : 0;
		},
	};
}

/** Loads koffi lazily and binds the needed kernel32 functions, once. */
export const loadKernel32 = onceAsync(async (): Promise<Kernel32> =>
	declareKernel32(await loadKoffi())
);
