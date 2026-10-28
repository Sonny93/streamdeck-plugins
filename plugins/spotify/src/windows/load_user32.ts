import type koffiModule from 'koffi';

import { bindWindowActivation } from './bind_window_activation';
import type { User32 } from './user32';
import { Win32Constants } from './win32_constants';
import type { WindowHandle } from './window_handle';

type Koffi = typeof koffiModule;
type Library = ReturnType<Koffi['load']>;

const NO_WINDOW = 0n;

function isWindowHandle(value: unknown): value is WindowHandle {
	return typeof value === 'bigint' && value !== NO_WINDOW;
}

function bindListTopLevelWindows(
	koffi: Koffi,
	library: Library
): User32['listTopLevelWindows'] {
	const callbackType = koffi.proto(
		'bool __stdcall EnumWindowsProc(void *window, intptr_t parameter)'
	);
	const enumWindows = library.func(
		'bool __stdcall EnumWindows(EnumWindowsProc *callback, intptr_t parameter)'
	);
	return () => {
		const windows: WindowHandle[] = [];
		const callback = koffi.register((window: unknown) => {
			if (isWindowHandle(window)) {
				windows.push(window);
			}
			return Win32Constants.continueEnumeration;
		}, koffi.pointer(callbackType));
		try {
			enumWindows(callback, Win32Constants.noCallbackParameter);
		} finally {
			koffi.unregister(callback);
		}
		return windows;
	};
}

function bindReadProcessId(library: Library): User32['readProcessId'] {
	const getWindowThreadProcessId = library.func(
		'uint32 __stdcall GetWindowThreadProcessId(void *window, _Out_ uint32 *processId)'
	);
	return (window) => {
		const processId = [0];
		getWindowThreadProcessId(window, processId);
		return processId[0] ?? 0;
	};
}

function bindGetForegroundWindow(
	library: Library
): User32['getForegroundWindow'] {
	const getForegroundWindow = library.func(
		'void *__stdcall GetForegroundWindow()'
	);
	return () => {
		const window: unknown = getForegroundWindow();
		return isWindowHandle(window) ? window : undefined;
	};
}

function bindWindowPredicates(
	library: Library
): Pick<User32, 'isVisible' | 'hasOwner'> {
	const isWindowVisible = library.func(
		'bool __stdcall IsWindowVisible(void *window)'
	);
	const getWindow = library.func(
		'void *__stdcall GetWindow(void *window, uint32 command)'
	);
	return {
		isVisible: (window) => isWindowVisible(window) === true,
		hasOwner: (window) =>
			isWindowHandle(getWindow(window, Win32Constants.getWindowOwnerCommand)),
	};
}

function bindStopFlashing(
	koffi: Koffi,
	library: Library
): User32['stopFlashing'] {
	const flashInfo = koffi.struct('FLASHWINFO', {
		cbSize: 'uint32',
		hwnd: 'void *',
		dwFlags: 'uint32',
		uCount: 'uint32',
		dwTimeout: 'uint32',
	});
	const flashWindowEx = library.func(
		'bool __stdcall FlashWindowEx(_In_ FLASHWINFO *info)'
	);
	return (window) => {
		flashWindowEx({
			cbSize: koffi.sizeof(flashInfo),
			hwnd: window,
			dwFlags: Win32Constants.flashStopFlags,
			uCount: Win32Constants.flashStopCount,
			dwTimeout: Win32Constants.flashStopTimeoutMilliseconds,
		});
	};
}

function declareUser32(koffi: Koffi): User32 {
	const library = koffi.load('user32.dll');
	return {
		listTopLevelWindows: bindListTopLevelWindows(koffi, library),
		readProcessId: bindReadProcessId(library),
		...bindWindowPredicates(library),
		getForegroundWindow: bindGetForegroundWindow(library),
		stopFlashing: bindStopFlashing(koffi, library),
		...bindWindowActivation(koffi, library),
	};
}

let cachedUser32: Promise<User32> | undefined;

/**
 * Loads koffi lazily and binds the needed user32 functions, once.
 * The native addon is imported on first use so a missing koffi cannot prevent the plugin from starting.
 */
export function loadUser32(): Promise<User32> {
	cachedUser32 ??= import('koffi')
		.then((module) => declareUser32(module.default))
		.catch((error: unknown) => {
			cachedUser32 = undefined;
			throw error;
		});
	return cachedUser32;
}
