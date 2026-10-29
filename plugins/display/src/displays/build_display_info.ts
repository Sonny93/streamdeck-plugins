import { buildMonitorId } from './build_monitor_id';
import type { DisplayInfo } from './display_info';
import type { ScreenBounds } from './screen_bounds';

/** Builds a monitor as Windows describes it, for tests: an SDR monitor without HDR unless told otherwise. */
export function buildDisplayInfo(
	options: Readonly<{
		pnpId: string;
		uid: number;
		model: string;
		gdiName: string;
		bounds: ScreenBounds;
		hdr?: DisplayInfo['hdr'];
	}>
): DisplayInfo {
	return {
		id: buildMonitorId(options.pnpId, options.uid),
		model: options.model,
		gdiName: options.gdiName,
		bounds: options.bounds,
		isPrimary: options.bounds.left === 0 && options.bounds.top === 0,
		target: { adapterLow: 1, adapterHigh: 0, id: options.uid },
		hdr: options.hdr ?? { isSupported: false, isEnabled: false },
		hdrApiVersion: 2,
		sdrWhiteLevel: 1000,
	};
}
