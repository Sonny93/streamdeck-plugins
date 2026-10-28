import { VoltButtons } from './volt_buttons';
import type { VoltState } from './volt_state';
import { VoltProtocol } from './volt_protocol';
import type { VoltButton } from './volt_button';

/** Reads the button states out of an input report, `undefined` when it is not a state report. */
export function parseVoltStateReport(
	report: Uint8Array
): VoltState | undefined {
	if (report[0] !== VoltProtocol.stateReportId) {
		return undefined;
	}
	const stateByte = report[VoltProtocol.stateByteIndex];
	if (stateByte === undefined) {
		return undefined;
	}
	const isOn = (button: VoltButton): boolean =>
		(stateByte & VoltButtons[button].stateBit) !== 0;
	return {
		monitor: isOn('monitor'),
		vintage: isOn('vintage'),
		phantomPower: isOn('phantomPower'),
	};
}
