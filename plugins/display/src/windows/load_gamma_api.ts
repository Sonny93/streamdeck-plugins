import { onceAsync } from '../shared/once_async';
import type { GammaApi } from './gamma_api';
import { isNativeHandle } from './is_native_handle';
import { loadKoffi } from './load_koffi';
import type { NativePointer } from './native_pointer';
import { Win32Constants } from './win32_constants';

const DISPLAY_DRIVER = 'DISPLAY';

/** Loads koffi lazily and binds the gamma ramp functions of gdi32, once. */
export const loadGammaApi = onceAsync(async (): Promise<GammaApi> => {
	const koffi = await loadKoffi();
	const library = koffi.load('gdi32.dll');
	const createDc = library.func(
		'void *__stdcall CreateDCW(str16 driver, str16 device, void *output, void *initData)'
	);
	const deleteDc = library.func('bool __stdcall DeleteDC(void *dc)');
	const getDeviceGammaRamp = library.func(
		'bool __stdcall GetDeviceGammaRamp(void *dc, void *ramp)'
	);
	const setDeviceGammaRamp = library.func(
		'bool __stdcall SetDeviceGammaRamp(void *dc, void *ramp)'
	);
	const withDc = <TResult>(
		gdiName: string,
		use: (dc: NativePointer) => TResult
	): TResult | undefined => {
		const dc: unknown = createDc(DISPLAY_DRIVER, gdiName, null, null);
		if (!isNativeHandle(dc)) {
			return undefined;
		}
		try {
			return use(dc);
		} finally {
			deleteDc(dc);
		}
	};
	return {
		readGammaRamp: (gdiName) =>
			withDc(gdiName, (dc) => {
				const ramp = new Uint16Array(Win32Constants.gammaRampLength);
				return getDeviceGammaRamp(dc, ramp) === true ? ramp : undefined;
			}),
		writeGammaRamp: (gdiName, ramp) =>
			withDc(gdiName, (dc) => setDeviceGammaRamp(dc, ramp) === true) ?? false,
	};
});
