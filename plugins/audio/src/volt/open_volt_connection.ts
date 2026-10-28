import type { FileHandle } from '../windows/file_handle';
import { HidInterfaceClass } from '../windows/hid_interface_class';
import type { Kernel32 } from '../windows/kernel32';
import { loadCfgmgr32 } from '../windows/load_cfgmgr32';
import { loadKernel32 } from '../windows/load_kernel32';
import { Win32Constants } from '../windows/win32_constants';
import { isVoltInterfacePath } from './is_volt_interface_path';
import type { VoltConnection } from './volt_connection';
import { VoltNotFoundError } from './volt_not_found_error';
import { VoltOpenError } from './volt_open_error';
import { VoltProtocol } from './volt_protocol';
import { VoltReadError } from './volt_read_error';
import { VoltWriteError } from './volt_write_error';

function openHandle(
	kernel32: Kernel32,
	path: string,
	access: number
): FileHandle {
	const handle = kernel32.createFile(path, access);
	if (handle === undefined) {
		throw new VoltOpenError(kernel32.getLastError());
	}
	return handle;
}

/**
 * Finds the vendor HID collection of the Volt 1 and opens it with one handle per direction:
 * a read blocks its handle until the next report, which can take long while the Volt 1 is silent.
 */
export async function openVoltConnection(): Promise<VoltConnection> {
	const [kernel32, cfgmgr32] = await Promise.all([
		loadKernel32(),
		loadCfgmgr32(),
	]);
	const path = cfgmgr32
		.listDeviceInterfaces(HidInterfaceClass)
		.find(isVoltInterfacePath);
	if (path === undefined) {
		throw new VoltNotFoundError();
	}
	const readHandle = openHandle(kernel32, path, Win32Constants.genericRead);
	let writeHandle: FileHandle;
	try {
		writeHandle = openHandle(kernel32, path, Win32Constants.genericWrite);
	} catch (error) {
		kernel32.closeHandle(readHandle);
		throw error;
	}
	return {
		readReport: async () => {
			const buffer = new Uint8Array(VoltProtocol.inputReportSize);
			const length = await kernel32.readFile(readHandle, buffer);
			if (length === undefined) {
				throw new VoltReadError();
			}
			return buffer.subarray(0, length);
		},
		writeReport: async (report) => {
			if (!(await kernel32.writeFile(writeHandle, report))) {
				throw new VoltWriteError();
			}
		},
		close: () => {
			kernel32.closeHandle(readHandle);
			kernel32.closeHandle(writeHandle);
		},
	};
}
