import { describe, expect, it } from 'vitest';

import { discoverVoltHidrawPath } from './discover_volt_hidraw_path';
import type { HidrawFileSystem } from './hidraw_file_system';

const VOLT_UEVENT =
	'DRIVER=hid-generic\nHID_ID=0003:00002B5A:00000020\nHID_NAME=Universal Audio Volt 1\n';
const KEYBOARD_UEVENT = 'DRIVER=hid-generic\nHID_ID=0003:000041E4:0000211A\n';
const VENDOR_DESCRIPTOR = Uint8Array.from([0x06, 0x01, 0xff, 0x09, 0x00]);
const KEYBOARD_DESCRIPTOR = Uint8Array.from([0x05, 0x01, 0x09, 0x06]);

type FakeNode = Readonly<{ uevent: string; descriptor: Uint8Array }>;

function createFileSystem(nodes: Readonly<Record<string, FakeNode>>) {
	const fileSystem: HidrawFileSystem = {
		readDirectory: () => Promise.resolve(Object.keys(nodes)),
		readFile: (path) => {
			const match = /\/(hidraw\d+)\/device\/(uevent|report_descriptor)$/u.exec(
				path
			);
			const node = match?.[1] === undefined ? undefined : nodes[match[1]];
			if (node === undefined) {
				return Promise.reject(new Error('ENOENT'));
			}
			return Promise.resolve(
				match?.[2] === 'uevent'
					? new TextEncoder().encode(node.uevent)
					: node.descriptor
			);
		},
	};
	return fileSystem;
}

describe('discoverVoltHidrawPath', () => {
	it('finds the vendor collection among the other hidraw nodes', async () => {
		const fileSystem = createFileSystem({
			hidraw0: { uevent: KEYBOARD_UEVENT, descriptor: KEYBOARD_DESCRIPTOR },
			hidraw3: { uevent: VOLT_UEVENT, descriptor: VENDOR_DESCRIPTOR },
		});

		await expect(discoverVoltHidrawPath(fileSystem)).resolves.toBe(
			'/dev/hidraw3'
		);
	});

	it('skips a node of the Volt 1 that is not the vendor collection', async () => {
		const fileSystem = createFileSystem({
			hidraw2: { uevent: VOLT_UEVENT, descriptor: KEYBOARD_DESCRIPTOR },
			hidraw3: { uevent: VOLT_UEVENT, descriptor: VENDOR_DESCRIPTOR },
		});

		await expect(discoverVoltHidrawPath(fileSystem)).resolves.toBe(
			'/dev/hidraw3'
		);
	});

	it('finds nothing when the Volt 1 is not plugged in', async () => {
		const fileSystem = createFileSystem({
			hidraw0: { uevent: KEYBOARD_UEVENT, descriptor: KEYBOARD_DESCRIPTOR },
		});

		await expect(discoverVoltHidrawPath(fileSystem)).resolves.toBeUndefined();
	});

	it('finds nothing when the hidraw directory cannot be read', async () => {
		const fileSystem: HidrawFileSystem = {
			readDirectory: () => Promise.reject(new Error('ENOENT')),
			readFile: () => Promise.reject(new Error('ENOENT')),
		};

		await expect(discoverVoltHidrawPath(fileSystem)).resolves.toBeUndefined();
	});

	it('ignores entries that are not hidraw nodes', async () => {
		const fileSystem = createFileSystem({
			'../../etc': { uevent: VOLT_UEVENT, descriptor: VENDOR_DESCRIPTOR },
		});

		await expect(discoverVoltHidrawPath(fileSystem)).resolves.toBeUndefined();
	});
});
