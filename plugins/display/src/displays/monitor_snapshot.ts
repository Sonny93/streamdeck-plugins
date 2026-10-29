import type { HdrInfo } from './hdr_info';
import type { ScreenPower } from './screen_power';

/** State of one monitor, shared by every action. */
export type MonitorSnapshot = Readonly<{
	id: string;
	/** Model and place of the monitor, such as "PL2530H (right)". */
	name: string;
	isPrimary: boolean;
	/** Brightness of the backlight or panel over DDC/CI, in percent; `undefined` without DDC/CI brightness. */
	monitorBrightness: number | undefined;
	/** Whether the monitor accepts a DDC/CI brightness yet keeps its picture as it was. */
	ignoresMonitorBrightness: boolean;
	/** Brightness Windows gives the picture, in percent: gamma ramp in SDR, "SDR content brightness" in HDR. */
	windowsBrightness: number | undefined;
	power: ScreenPower;
	/** Whether the monitor can be turned off over DDC/CI. */
	canStandby: boolean;
	hdr: HdrInfo;
}>;
