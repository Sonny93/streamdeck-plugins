import type koffiModule from 'koffi';

import type { User32 } from './user32';
import { Win32Constants } from './win32_constants';
import { Win32StructSizeError } from './win32_struct_size_error';

type Koffi = typeof koffiModule;
type Library = ReturnType<Koffi['load']>;

type ActivationBindings = Pick<
	User32,
	'isMinimized' | 'restore' | 'sendZeroMouseMove' | 'setForeground'
>;

function declareInputStruct(koffi: Koffi): ReturnType<Koffi['struct']> {
	const mouseInput = koffi.struct('MOUSEINPUT', {
		dx: 'int32',
		dy: 'int32',
		mouseData: 'uint32',
		dwFlags: 'uint32',
		time: 'uint32',
		dwExtraInfo: 'uintptr_t',
	});
	const input = koffi.struct('INPUT', { type: 'uint32', mi: mouseInput });
	const actualBytes = koffi.sizeof(input);
	if (actualBytes !== Win32Constants.inputStructSizeBytes) {
		throw new Win32StructSizeError({
			structName: 'INPUT',
			expectedBytes: Win32Constants.inputStructSizeBytes,
			actualBytes,
		});
	}
	return input;
}

function bindSendZeroMouseMove(
	koffi: Koffi,
	library: Library
): ActivationBindings['sendZeroMouseMove'] {
	const input = declareInputStruct(koffi);
	const sendInput = library.func(
		'uint32 __stdcall SendInput(uint32 count, _In_ INPUT *inputs, int size)'
	);
	const zeroMouseMove = {
		type: Win32Constants.inputTypeMouse,
		mi: {
			dx: 0,
			dy: 0,
			mouseData: 0,
			dwFlags: Win32Constants.mouseEventMove,
			time: 0,
			dwExtraInfo: 0,
		},
	};
	return () => {
		sendInput(1, [zeroMouseMove], koffi.sizeof(input));
	};
}

/**
 * Binds the calls needed to activate a window from a background process.
 * A zero mouse move through SendInput first makes Windows grant `SetForegroundWindow`.
 */
export function bindWindowActivation(
	koffi: Koffi,
	library: Library
): ActivationBindings {
	const isIconic = library.func('bool __stdcall IsIconic(void *window)');
	const showWindow = library.func(
		'bool __stdcall ShowWindow(void *window, int command)'
	);
	const setForegroundWindow = library.func(
		'bool __stdcall SetForegroundWindow(void *window)'
	);
	return {
		isMinimized: (window) => isIconic(window) === true,
		restore: (window) => {
			showWindow(window, Win32Constants.showWindowRestoreCommand);
		},
		sendZeroMouseMove: bindSendZeroMouseMove(koffi, library),
		setForeground: (window) => setForegroundWindow(window) === true,
	};
}
