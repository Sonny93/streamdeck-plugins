import { buildMonitorId } from './build_monitor_id';
import type { DisplayInfo } from './display_info';
import type { ScreenBounds } from './screen_bounds';

const PNP_MANUFACTURER_LENGTH = 3;

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
		manufacturerId: options.pnpId.slice(0, PNP_MANUFACTURER_LENGTH),
		productCode: options.pnpId.slice(PNP_MANUFACTURER_LENGTH),
		portName: options.gdiName.replace(/^\\\\\.\\/u, ''),
		bounds: options.bounds,
		isPrimary: options.bounds.left === 0 && options.bounds.top === 0,
		hdr: options.hdr ?? { isSupported: false, isEnabled: false },
		platform: {
			kind: 'windows',
			gdiName: options.gdiName,
			target: { adapterLow: 1, adapterHigh: 0, id: options.uid },
			hdrApiVersion: 2,
			sdrWhiteLevel: 1000,
		},
	};
}
