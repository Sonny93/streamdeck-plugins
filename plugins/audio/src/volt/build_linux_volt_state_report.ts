import { VoltProtocol } from './volt_protocol';

/** Bytes 2 and up of a state report read from `/dev/hidraw` on a real Volt 1: Linux delivers 14 bytes, cut after the meter bits. */
const CAPTURED_LINUX_REPORT_TAIL = Uint8Array.from(
	Buffer.from('00000000000000000000' + '8000', 'hex')
);

/** Test factory: a state report as Linux delivers it (14 bytes), with the given state byte. */
export function buildLinuxVoltStateReport(stateByte: number): Uint8Array {
	return Uint8Array.from([
		VoltProtocol.stateReportId,
		stateByte,
		...CAPTURED_LINUX_REPORT_TAIL,
	]);
}
