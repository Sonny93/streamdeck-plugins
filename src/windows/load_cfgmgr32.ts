import type koffiModule from 'koffi';

import { loadKoffi } from './load_koffi';
import type { Cfgmgr32 } from './cfgmgr32';
import { onceAsync } from '../shared/once_async';
import { Win32Constants } from './win32_constants';
import { splitMultiString } from './split_multi_string';
import { DeviceInterfaceListError } from './device_interface_list_error';

type Koffi = typeof koffiModule;

const GUID_TAIL_LENGTH = 8;
const ANY_DEVICE = null;

function assertSuccess(call: string, result: unknown): void {
	if (result !== Win32Constants.configRetSuccess) {
		throw new DeviceInterfaceListError({ call, result });
	}
}

function declareCfgmgr32(koffi: Koffi): Cfgmgr32 {
	koffi.struct('GUID', {
		Data1: 'uint32',
		Data2: 'uint16',
		Data3: 'uint16',
		Data4: koffi.array('uint8', GUID_TAIL_LENGTH),
	});
	const library = koffi.load('cfgmgr32.dll');
	const getListSize = library.func(
		'uint32 __stdcall CM_Get_Device_Interface_List_SizeW(_Out_ uint32 *length, _In_ GUID *interfaceClass, void *deviceId, uint32 flags)'
	);
	const getList = library.func(
		'uint32 __stdcall CM_Get_Device_Interface_ListW(_In_ GUID *interfaceClass, void *deviceId, _Out_ uint8 *buffer, uint32 length, uint32 flags)'
	);
	return {
		listDeviceInterfaces: (interfaceClass) => {
			const length = [0];
			assertSuccess(
				'CM_Get_Device_Interface_List_SizeW',
				getListSize(
					length,
					interfaceClass,
					ANY_DEVICE,
					Win32Constants.presentInterfacesOnly
				)
			);
			const characterCount = length[0] ?? 0;
			const buffer = Buffer.alloc(
				characterCount * Win32Constants.utf16BytesPerCharacter
			);
			assertSuccess(
				'CM_Get_Device_Interface_ListW',
				getList(
					interfaceClass,
					ANY_DEVICE,
					buffer,
					characterCount,
					Win32Constants.presentInterfacesOnly
				)
			);
			return splitMultiString(buffer.toString('utf16le'));
		},
	};
}

/** Loads koffi lazily and binds the needed cfgmgr32 functions, once. */
export const loadCfgmgr32 = onceAsync(async (): Promise<Cfgmgr32> =>
	declareCfgmgr32(await loadKoffi())
);
