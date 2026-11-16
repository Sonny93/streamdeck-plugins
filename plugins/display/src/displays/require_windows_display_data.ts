import type { DisplayInfo } from './display_info';
import { ForeignDisplayError } from './foreign_display_error';
import type { WindowsDisplayData } from './windows_display_data';

/** Gives the Windows part of a monitor. */
export function requireWindowsDisplayData(
	display: DisplayInfo
): WindowsDisplayData {
	if (display.platform.kind !== 'windows') {
		throw new ForeignDisplayError({
			monitorId: display.id,
			adapter: 'Windows',
		});
	}
	return display.platform;
}
