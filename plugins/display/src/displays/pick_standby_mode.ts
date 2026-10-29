import { PowerMode } from './power_mode';
import type { VcpCapabilities } from './vcp_capabilities';
import { VcpCode } from './vcp_code';

const PREFERRED_MODES = [
	PowerMode.displayOff,
	PowerMode.powerOff,
	PowerMode.suspend,
	PowerMode.standby,
] as const;

/**
 * Picks the power mode that turns a monitor off over DDC/CI: "display off" when it lists it, its other off modes otherwise.
 * `undefined` when the monitor has no power mode; "display off" when it has one but lists no value.
 */
export function pickStandbyMode(
	capabilities: VcpCapabilities
): number | undefined {
	const modes = capabilities.get(VcpCode.powerMode);
	if (modes === undefined) {
		return undefined;
	}
	if (modes.length === 0) {
		return PowerMode.displayOff;
	}
	return PREFERRED_MODES.find((mode) => modes.includes(mode));
}
