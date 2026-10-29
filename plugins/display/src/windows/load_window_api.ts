import { onceAsync } from '../shared/once_async';
import { isNativeHandle } from './is_native_handle';
import { loadKoffi } from './load_koffi';
import { loadUser32 } from './load_user32';
import { Win32Constants } from './win32_constants';
import type { WindowApi } from './window_api';

const WINDOW_CLASS_TYPE = 'WNDCLASSEXW';
const WINDOW_CLASS_NAME = 'DisplayDeckBlackScreen';
const WINDOW_TITLE = 'Display Deck black screen';
const NO_WINDOW = null;
const ALL_MESSAGES = 0;

/**
 * Loads koffi lazily and binds the window functions of user32, once.
 * The window class paints itself black through its brush and leaves every message to `DefWindowProcW`,
 * so no JavaScript runs inside a window procedure.
 */
export const loadWindowApi = onceAsync(async (): Promise<WindowApi> => {
	const koffi = await loadKoffi();
	const user32 = await loadUser32();
	const kernel32 = koffi.load('kernel32.dll');
	const gdi32 = koffi.load('gdi32.dll');
	try {
		koffi.type(WINDOW_CLASS_TYPE);
	} catch {
		koffi.struct(WINDOW_CLASS_TYPE, {
			cbSize: 'uint32',
			style: 'uint32',
			lpfnWndProc: 'void *',
			cbClsExtra: 'int32',
			cbWndExtra: 'int32',
			hInstance: 'void *',
			hIcon: 'void *',
			hCursor: 'void *',
			hbrBackground: 'void *',
			lpszMenuName: 'void *',
			lpszClassName: 'str16',
			hIconSm: 'void *',
		});
	}
	const getModuleHandle = kernel32.func(
		'void *__stdcall GetModuleHandleW(str16 name)'
	);
	const getProcAddress = kernel32.func(
		'void *__stdcall GetProcAddress(void *module, str name)'
	);
	const getStockObject = gdi32.func(
		'void *__stdcall GetStockObject(int32 kind)'
	);
	const loadCursor = user32.func(
		'void *__stdcall LoadCursorW(void *instance, void *name)'
	);
	const registerClass = user32.func(
		'uint16 __stdcall RegisterClassExW(_In_ WNDCLASSEXW *windowClass)'
	);
	const createWindow = user32.func(
		'void *__stdcall CreateWindowExW(uint32 exStyle, str16 className, str16 title, uint32 style, int32 x, int32 y, int32 width, int32 height, void *parent, void *menu, void *instance, void *parameter)'
	);
	const showWindow = user32.func(
		'bool __stdcall ShowWindow(void *window, int32 command)'
	);
	const setWindowPos = user32.func(
		'bool __stdcall SetWindowPos(void *window, intptr insertAfter, int32 x, int32 y, int32 width, int32 height, uint32 flags)'
	);
	const destroyWindow = user32.func(
		'bool __stdcall DestroyWindow(void *window)'
	);
	const isWindow = user32.func('bool __stdcall IsWindow(void *window)');
	const peekMessage = user32.func(
		'bool __stdcall PeekMessageW(void *message, void *window, uint32 first, uint32 last, uint32 remove)'
	);
	const translateMessage = user32.func(
		'bool __stdcall TranslateMessage(void *message)'
	);
	const dispatchMessage = user32.func(
		'intptr __stdcall DispatchMessageW(void *message)'
	);

	const user32Module: unknown = getModuleHandle('user32.dll');
	const instance: unknown = getModuleHandle(null);
	registerClass({
		cbSize: koffi.sizeof(WINDOW_CLASS_TYPE),
		style: 0,
		lpfnWndProc: getProcAddress(user32Module, 'DefWindowProcW'),
		cbClsExtra: 0,
		cbWndExtra: 0,
		hInstance: instance,
		hIcon: null,
		hCursor: loadCursor(null, Win32Constants.arrowCursor),
		hbrBackground: getStockObject(Win32Constants.blackBrush),
		lpszMenuName: null,
		lpszClassName: WINDOW_CLASS_NAME,
		hIconSm: null,
	});
	const message = Buffer.alloc(Win32Constants.messageSize);

	return {
		createBlackWindow: (rect) => {
			const window: unknown = createWindow(
				Win32Constants.wsExTopmost |
					Win32Constants.wsExToolWindow |
					Win32Constants.wsExNoActivate,
				WINDOW_CLASS_NAME,
				WINDOW_TITLE,
				Win32Constants.wsPopup,
				rect.left,
				rect.top,
				rect.width,
				rect.height,
				NO_WINDOW,
				null,
				instance,
				null
			);
			if (!isNativeHandle(window)) {
				return undefined;
			}
			showWindow(window, Win32Constants.swShowNoActivate);
			return window;
		},
		raiseWindow: (window, rect) => {
			setWindowPos(
				window,
				Win32Constants.hwndTopmost,
				rect.left,
				rect.top,
				rect.width,
				rect.height,
				Win32Constants.swpNoActivate | Win32Constants.swpShowWindow
			);
		},
		destroyWindow: (window) => {
			destroyWindow(window);
		},
		isWindow: (window) => isWindow(window) === true,
		pumpMessages: () => {
			while (
				peekMessage(
					message,
					NO_WINDOW,
					ALL_MESSAGES,
					ALL_MESSAGES,
					Win32Constants.pmRemove
				) === true
			) {
				translateMessage(message);
				dispatchMessage(message);
			}
		},
	};
});
