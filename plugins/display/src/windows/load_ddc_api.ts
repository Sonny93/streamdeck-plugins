import { onceAsync } from 'deck-kit/async/once_async';
import { callOnWorker } from 'deck-kit/windows/call_on_worker';
import { loadKoffi } from 'deck-kit/windows/load_koffi';

import type { DdcApi } from './ddc_api';
import { isNativeHandle } from './is_native_handle';
import { loadUser32 } from './load_user32';
import { Win32Constants } from './win32_constants';

const FIRST_PHYSICAL_MONITOR = 1;

/** Loads koffi lazily and binds the DDC/CI functions of dxva2, once. */
export const loadDdcApi = onceAsync(async (): Promise<DdcApi> => {
	const koffi = await loadKoffi();
	const user32 = await loadUser32();
	const library = koffi.load('dxva2.dll');
	const monitorFromRect = user32.func(
		'void *__stdcall MonitorFromRect(void *rect, uint32 flags)'
	);
	const getPhysicalMonitors = library.func(
		'bool __stdcall GetPhysicalMonitorsFromHMONITOR(void *monitor, uint32 count, void *physicalMonitors)'
	);
	const destroyPhysicalMonitor = library.func(
		'bool __stdcall DestroyPhysicalMonitor(void *physicalMonitor)'
	);
	const getCapabilitiesLength = library.func(
		'bool __stdcall GetCapabilitiesStringLength(void *physicalMonitor, _Out_ uint32 *length)'
	);
	const getCapabilities = library.func(
		'bool __stdcall CapabilitiesRequestAndCapabilitiesReply(void *physicalMonitor, void *capabilities, uint32 length)'
	);
	const getVcp = library.func(
		'bool __stdcall GetVCPFeatureAndVCPFeatureReply(void *physicalMonitor, uint8 code, _Out_ uint32 *type, _Out_ uint32 *current, _Out_ uint32 *maximum)'
	);
	const setVcp = library.func(
		'bool __stdcall SetVCPFeature(void *physicalMonitor, uint8 code, uint32 value)'
	);
	return {
		openPhysicalMonitor: (rect) => {
			const rectBuffer = Buffer.alloc(Win32Constants.rectSize);
			rectBuffer.writeInt32LE(rect.left, 0);
			rectBuffer.writeInt32LE(rect.top, 4);
			rectBuffer.writeInt32LE(rect.right, 8);
			rectBuffer.writeInt32LE(rect.bottom, 12);
			const monitor: unknown = monitorFromRect(
				rectBuffer,
				Win32Constants.monitorDefaultToNull
			);
			if (!isNativeHandle(monitor)) {
				return undefined;
			}
			const physicalMonitors = Buffer.alloc(Win32Constants.physicalMonitorSize);
			if (
				getPhysicalMonitors(
					monitor,
					FIRST_PHYSICAL_MONITOR,
					physicalMonitors
				) !== true
			) {
				return undefined;
			}
			// dxva2 numbers the physical monitors it opens from 0, so 0 is a valid handle here.
			return physicalMonitors.readBigUInt64LE(0);
		},
		closePhysicalMonitor: (handle) => {
			destroyPhysicalMonitor(handle);
		},
		readCapabilities: async (handle) => {
			const length = [0];
			if (
				(await callOnWorker(getCapabilitiesLength, handle, length)) !== true
			) {
				return undefined;
			}
			const capabilities = Buffer.alloc(length[0] ?? 0);
			const isRead = await callOnWorker(
				getCapabilities,
				handle,
				capabilities,
				capabilities.byteLength
			);
			return isRead === true
				? capabilities.toString('latin1').replaceAll('\0', '')
				: undefined;
		},
		readVcp: async (handle, code) => {
			const type = [0];
			const current = [0];
			const maximum = [0];
			const isRead = await callOnWorker(
				getVcp,
				handle,
				code,
				type,
				current,
				maximum
			);
			return isRead === true
				? { current: current[0] ?? 0, maximum: maximum[0] ?? 0 }
				: undefined;
		},
		writeVcp: async (handle, code, value) =>
			(await callOnWorker(setVcp, handle, code, value)) === true,
	};
});
