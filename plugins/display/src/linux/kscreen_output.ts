import type { HdrInfo } from '../displays/hdr_info';
import type { ScreenBounds } from '../displays/screen_bounds';

/** An enabled output as `kscreen-doctor -j` describes it. */
export type KscreenOutput = Readonly<{
	/** DRM connector name, such as `DP-4`. */
	connector: string;
	isPrimary: boolean;
	/** Place and size on the desktop, in logical pixels (the size of the mode divided by the scale). */
	bounds: ScreenBounds;
	hdr: HdrInfo;
	/** Brightness KWin gives the output, in percent: its backlight over DDC/CI when `isDdcCiAllowed`, a dimming of the picture otherwise. */
	brightnessPercent: number | undefined;
	/** White level of SDR content in HDR, in nits; only HDR capable outputs have one. */
	sdrBrightnessNits: number | undefined;
	/** Whether KWin drives the DDC/CI of the output, and so owns its backlight. */
	isDdcCiAllowed: boolean;
}>;
