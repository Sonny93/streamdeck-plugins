import { VoltProtocol } from './volt_protocol';

/** Tells whether a HID device interface path is the vendor collection of the Volt 1. */
export function isVoltInterfacePath(path: string): boolean {
	return path.toLowerCase().includes(VoltProtocol.interfacePathMarker);
}
