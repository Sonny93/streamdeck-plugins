import { onceAsync } from 'deck-kit/async/once_async';
import { loadKoffi } from 'deck-kit/windows/load_koffi';
import type koffiModule from 'koffi';

import { Win32Constants } from './win32_constants';

type Library = ReturnType<(typeof koffiModule)['load']>;

/**
 * Loads user32 once, and makes the plugin thread aware of the DPI of each screen first:
 * the screen positions Windows reports are physical pixels, and the windows and monitor lookups must use the same ones.
 */
export const loadUser32 = onceAsync(async (): Promise<Library> => {
	const koffi = await loadKoffi();
	const library = koffi.load('user32.dll');
	const setThreadDpiAwarenessContext = library.func(
		'intptr __stdcall SetThreadDpiAwarenessContext(intptr context)'
	);
	setThreadDpiAwarenessContext(Win32Constants.perMonitorDpiAwareV2);
	return library;
});
