import { describe, expect, it, vi } from 'vitest';

import { buildVoltSettingsReport } from '../volt/build_volt_settings_report';
import { buildVoltState } from '../volt/build_volt_state';
import { VoltNotFoundError } from '../volt/volt_not_found_error';
import { VoltOpenError } from '../volt/volt_open_error';
import { VoltReadError } from '../volt/volt_read_error';
import { VoltWriteError } from '../volt/volt_write_error';
import type { HidrawFileSystem } from './hidraw_file_system';
import type { HidrawHandle } from './hidraw_handle';
import { openLinuxVoltConnection } from './open_linux_volt_connection';

const STATE_REPORT_14_BYTES = Uint8Array.from([
	0x02, 0x41, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x80, 0,
]);

const voltFileSystem: HidrawFileSystem = {
	readDirectory: () => Promise.resolve(['hidraw3']),
	readFile: (path) =>
		Promise.resolve(
			path.endsWith('uevent')
				? new TextEncoder().encode('HID_ID=0003:00002B5A:00000020\n')
				: Uint8Array.from([0x06, 0x01, 0xff, 0x09])
		),
};

function createHandle(overrides: Partial<HidrawHandle> = {}) {
	const handle: HidrawHandle = {
		read: vi.fn((buffer: Uint8Array) => {
			buffer.set(STATE_REPORT_14_BYTES);
			return Promise.resolve(STATE_REPORT_14_BYTES.length);
		}),
		write: vi.fn((report: Uint8Array) => Promise.resolve(report.length)),
		close: vi.fn(() => Promise.resolve()),
		...overrides,
	};
	return handle;
}

function openWith(handle: HidrawHandle) {
	const openHandle = vi.fn(() => Promise.resolve(handle));
	return {
		openHandle,
		connection: openLinuxVoltConnection({
			fileSystem: voltFileSystem,
			openHandle,
		}),
	};
}

describe('openLinuxVoltConnection', () => {
	it('opens the hidraw node of the vendor collection', async () => {
		const { openHandle, connection } = openWith(createHandle());

		await connection;

		expect(openHandle).toHaveBeenCalledWith('/dev/hidraw3');
	});

	it('returns a report as long as the kernel delivered it', async () => {
		const { connection } = openWith(createHandle());

		const report = await (await connection).readReport();

		expect(Array.from(report)).toEqual(Array.from(STATE_REPORT_14_BYTES));
	});

	it('writes the 17-byte settings report unchanged, report id first', async () => {
		const handle = createHandle();
		const { connection } = openWith(handle);
		const report = buildVoltSettingsReport(buildVoltState({ monitor: true }));

		await (await connection).writeReport(report);

		expect(handle.write).toHaveBeenCalledWith(report);
		expect(report).toHaveLength(17);
		expect(report[0]).toBe(0x10);
	});

	it('fails the write when the kernel took fewer bytes than the report', async () => {
		const { connection } = openWith(
			createHandle({ write: () => Promise.resolve(1) })
		);

		await expect(
			(await connection).writeReport(buildVoltSettingsReport(buildVoltState()))
		).rejects.toBeInstanceOf(VoltWriteError);
	});

	it('fails the read when the device is gone', async () => {
		const { connection } = openWith(
			createHandle({ read: () => Promise.reject(new Error('EIO')) })
		);

		await expect((await connection).readReport()).rejects.toBeInstanceOf(
			VoltReadError
		);
	});

	it('refuses to read or write once closed, and closes the handle', async () => {
		const handle = createHandle();
		const link = await openWith(handle).connection;

		link.close();

		expect(handle.close).toHaveBeenCalledOnce();
		await expect(link.readReport()).rejects.toBeInstanceOf(VoltReadError);
		await expect(
			link.writeReport(buildVoltSettingsReport(buildVoltState()))
		).rejects.toBeInstanceOf(VoltWriteError);
	});

	it('reports the system error code when the node cannot be opened', async () => {
		const denied = Object.assign(new Error('denied'), { code: 'EACCES' });

		await expect(
			openLinuxVoltConnection({
				fileSystem: voltFileSystem,
				openHandle: () => Promise.reject(denied),
			})
		).rejects.toThrow(new VoltOpenError('EACCES'));
	});

	it('is not found when the Volt 1 is not plugged in', async () => {
		await expect(
			openLinuxVoltConnection({
				fileSystem: {
					readDirectory: () => Promise.resolve([]),
					readFile: () => Promise.reject(new Error('ENOENT')),
				},
			})
		).rejects.toBeInstanceOf(VoltNotFoundError);
	});
});
