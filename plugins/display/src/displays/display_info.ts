import type { DisplayPlatformData } from './display_platform_data';
import type { HdrInfo } from './hdr_info';
import type { ScreenBounds } from './screen_bounds';

/** A monitor the system lights, as its platform describes it. */
export type DisplayInfo = Readonly<{
	/** Stable id of the monitor: its device interface path on Windows, a string built from its EDID on Linux. */
	id: string;
	/** Model name from the EDID of the monitor, such as "Odyssey G95SD". */
	model: string;
	/** Three-letter PnP manufacturer id from the EDID, such as `SAM`; empty when unknown. */
	manufacturerId: string;
	/** Product code from the EDID as four hex digits, such as `E05C`; empty when unknown. */
	productCode: string;
	/** Name of the port the monitor is plugged in, such as `DISPLAY1` or `DP-4`, to tell apart monitors of one model. */
	portName: string;
	bounds: ScreenBounds;
	isPrimary: boolean;
	hdr: HdrInfo;
	platform: DisplayPlatformData;
}>;
