import { VoltProtocol } from './volt_protocol';

/** Bytes 2 and up of a state report captured on a real Volt 1 (meter bits, serial number, identifiers). */
const CAPTURED_REPORT_TAIL = Uint8Array.from(
	Buffer.from(
		'00000000000000000000000836303739343830a12cb66a9d544cdfa9f6824a26a3028dff01ff',
		'hex'
	)
);

/** Test factory: a state report as the Volt 1 sends it, with the given state byte. */
export function buildVoltStateReport(
	stateByte: number,
	reportId: number = VoltProtocol.stateReportId
): Uint8Array {
	return Uint8Array.from([reportId, stateByte, ...CAPTURED_REPORT_TAIL]);
}
