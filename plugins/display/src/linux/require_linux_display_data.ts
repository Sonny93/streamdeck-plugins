import type { DisplayInfo } from '../displays/display_info';
import { ForeignDisplayError } from '../displays/foreign_display_error';
import type { LinuxDisplayData } from '../displays/linux_display_data';

/** Gives the Linux part of a monitor. */
export function requireLinuxDisplayData(
	display: DisplayInfo
): LinuxDisplayData {
	if (display.platform.kind !== 'linux') {
		throw new ForeignDisplayError({ monitorId: display.id, adapter: 'Linux' });
	}
	return display.platform;
}
