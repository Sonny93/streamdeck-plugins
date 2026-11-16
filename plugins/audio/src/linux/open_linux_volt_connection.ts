import type { VoltConnection } from '../volt/volt_connection';
import { VoltNotFoundError } from '../volt/volt_not_found_error';
import { VoltOpenError } from '../volt/volt_open_error';
import { VoltProtocol } from '../volt/volt_protocol';
import { VoltReadError } from '../volt/volt_read_error';
import { VoltWriteError } from '../volt/volt_write_error';
import { discoverVoltHidrawPath } from './discover_volt_hidraw_path';
import type { HidrawFileSystem } from './hidraw_file_system';
import type { HidrawHandle } from './hidraw_handle';
import { nodeHidrawFileSystem } from './node_hidraw_file_system';
import { openHidrawHandle } from './open_hidraw_handle';
import { readErrorCode } from './read_error_code';

type OpenLinuxVoltConnectionOptions = Readonly<{
	fileSystem?: HidrawFileSystem;
	openHandle?: (path: string) => Promise<HidrawHandle>;
}>;

async function openHandleOrThrow(
	openHandle: (path: string) => Promise<HidrawHandle>,
	path: string
): Promise<HidrawHandle> {
	try {
		return await openHandle(path);
	} catch (error) {
		throw new VoltOpenError(readErrorCode(error), error);
	}
}

/**
 * Finds the vendor HID collection of the Volt 1 under `/dev/hidrawN` and opens it once for reading and writing.
 * A read that fails, as after an unplug (`EIO`, `EBADF`), rejects, which ends the hub's read loop; the hub then closes the link.
 * Closing waits for a read still blocked, so the hub only closes after its loop ended.
 */
export async function openLinuxVoltConnection(
	options: OpenLinuxVoltConnectionOptions = {}
): Promise<VoltConnection> {
	const path = await discoverVoltHidrawPath(
		options.fileSystem ?? nodeHidrawFileSystem
	);
	if (path === undefined) {
		throw new VoltNotFoundError();
	}
	const handle = await openHandleOrThrow(
		options.openHandle ?? openHidrawHandle,
		path
	);
	let isClosed = false;
	return {
		readReport: async () => {
			if (isClosed) {
				throw new VoltReadError();
			}
			const buffer = new Uint8Array(VoltProtocol.linuxReadBufferSize);
			let length: number;
			try {
				length = await handle.read(buffer);
			} catch (error) {
				throw new VoltReadError(error);
			}
			if (length === 0) {
				throw new VoltReadError();
			}
			return buffer.subarray(0, length);
		},
		writeReport: async (report) => {
			if (isClosed) {
				throw new VoltWriteError();
			}
			let bytesWritten: number;
			try {
				bytesWritten = await handle.write(report);
			} catch (error) {
				throw new VoltWriteError(error);
			}
			if (bytesWritten !== report.length) {
				throw new VoltWriteError();
			}
		},
		close: () => {
			isClosed = true;
			handle.close().catch(() => undefined);
		},
	};
}
