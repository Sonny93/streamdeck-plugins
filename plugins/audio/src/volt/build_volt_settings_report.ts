import { VoltButtonNames } from './volt_button_names';
import { VoltButtons } from './volt_buttons';
import { VoltProtocol } from './volt_protocol';
import type { VoltState } from './volt_state';

/**
 * Builds the settings report that applies a whole state.
 * Every button is written, and the Volt 1 applies a single change per report:
 * the state must hold the current value of every button but the one that changes.
 */
export function buildVoltSettingsReport(state: VoltState): Uint8Array {
	const report = new Uint8Array(VoltProtocol.settingsReportSize);
	report[0] = VoltProtocol.settingsReportId;
	report[VoltProtocol.settingsByteIndex] = VoltButtonNames.reduce(
		(settings, button) =>
			state[button] ? settings | VoltButtons[button].settingBit : settings,
		0
	);
	return report;
}
