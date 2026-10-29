import type { DisplayTarget } from './display_target';
import type { HdrApiVersion } from './hdr_api_version';
import type { HdrInfo } from './hdr_info';
import type { ScreenBounds } from './screen_bounds';

/** A monitor lit by Windows, as its display configuration describes it. */
export type DisplayInfo = Readonly<{
	/** Device interface path of the monitor, stable for a monitor on the same port. */
	id: string;
	/** Model name from the EDID of the monitor, such as "Odyssey G95SD". */
	model: string;
	/** GDI device name of the desktop source, such as `\\.\DISPLAY1`. */
	gdiName: string;
	bounds: ScreenBounds;
	isPrimary: boolean;
	target: DisplayTarget;
	hdr: HdrInfo;
	hdrApiVersion: HdrApiVersion;
	/** White level of SDR content while HDR is on, in thousandths of 80 nits; `undefined` when Windows does not tell. */
	sdrWhiteLevel: number | undefined;
}>;
