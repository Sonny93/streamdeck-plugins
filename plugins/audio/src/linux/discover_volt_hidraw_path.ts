import { VoltProtocol } from '../volt/volt_protocol';
import type { HidrawFileSystem } from './hidraw_file_system';

const SYSFS_HIDRAW_DIRECTORY = '/sys/class/hidraw';
const DEVICE_DIRECTORY = '/dev';
const HIDRAW_NAME_PATTERN = /^hidraw\d+$/u;

function hasVoltHidId(uevent: string): boolean {
	const expected = `HID_ID=${VoltProtocol.linuxHidId}`.toLowerCase();
	return uevent
		.split('\n')
		.some((line) => line.trim().toLowerCase() === expected);
}

function isVendorDescriptor(descriptor: Uint8Array): boolean {
	return VoltProtocol.vendorDescriptorPrefix.every(
		(byte, index) => descriptor[index] === byte
	);
}

async function isVendorCollection(
	fileSystem: HidrawFileSystem,
	name: string
): Promise<boolean> {
	try {
		const deviceDirectory = `${SYSFS_HIDRAW_DIRECTORY}/${name}/device`;
		const uevent = await fileSystem.readFile(`${deviceDirectory}/uevent`);
		if (!hasVoltHidId(new TextDecoder().decode(uevent))) {
			return false;
		}
		return isVendorDescriptor(
			await fileSystem.readFile(`${deviceDirectory}/report_descriptor`)
		);
	} catch {
		return false;
	}
}

/**
 * Finds the `/dev/hidrawN` node of the vendor HID collection of the Volt 1, `undefined` when it is not plugged in.
 * The Volt 1 has several hidraw nodes: the uevent names the device and the report descriptor tells which interface is the vendor one.
 */
export async function discoverVoltHidrawPath(
	fileSystem: HidrawFileSystem
): Promise<string | undefined> {
	let names: string[];
	try {
		names = await fileSystem.readDirectory(SYSFS_HIDRAW_DIRECTORY);
	} catch {
		return undefined;
	}
	const hidrawNames = names.filter((entry) => HIDRAW_NAME_PATTERN.test(entry));
	const matches = await Promise.all(
		hidrawNames.map((name) => isVendorCollection(fileSystem, name))
	);
	const index = matches.indexOf(true);
	return index === -1 ? undefined : `${DEVICE_DIRECTORY}/${hidrawNames[index]}`;
}
