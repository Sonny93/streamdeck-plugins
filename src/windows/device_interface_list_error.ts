/** Raised when Windows cannot list the device interfaces of a class. */
export class DeviceInterfaceListError extends Error {
	readonly code = 'E_DEVICE_INTERFACE_LIST';
	override readonly name = 'DeviceInterfaceListError';

	constructor(options: Readonly<{ call: string; result: unknown }>) {
		super(`${options.call} failed with CONFIGRET ${String(options.result)}.`);
	}
}
