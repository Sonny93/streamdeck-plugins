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
	/** Brightness the system gives the picture, in percent, apart from the monitor; `undefined` when the system has none to give. */
	systemBrightness: number | undefined;
	power: ScreenPower;
	/** Whether the monitor can be turned off over DDC/CI. */
	canStandby: boolean;
	/** Whether a black screen can cover the monitor. */
	canBlackScreen: boolean;
	hdr: HdrInfo;
}>;
