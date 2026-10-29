import type { DdcMonitor } from './ddc_monitor';
import type { DisplayInfo } from './display_info';

/** What the plugin reads and changes on the monitors of Windows; injected so the display hub can be tested without them. */
export type DisplaySystem = Readonly<{
	listDisplays: () => readonly DisplayInfo[];
	/**
	 * Brightness Windows gives the picture of a monitor, in percent: the gamma ramp in SDR, the "SDR content brightness" in HDR.
	 * `undefined` when Windows does not tell.
	 */
	readWindowsBrightness: (display: DisplayInfo) => number | undefined;
	/** Sets the brightness Windows gives the picture and returns the one it took, as the gamma ramp cannot go below a floor. */
	writeWindowsBrightness: (display: DisplayInfo, percent: number) => number;
	writeHdr: (display: DisplayInfo, isEnabled: boolean) => void;
	/** Opens a monitor for DDC/CI, `undefined` when Windows finds no physical monitor behind it. */
	openDdcMonitor: (display: DisplayInfo) => DdcMonitor | undefined;
	showBlackScreen: (display: DisplayInfo) => void;
	hideBlackScreen: (monitorId: string) => void;
	hasBlackScreen: (monitorId: string) => boolean;
	/** Keeps the black screens over their monitors and on top, and drops those of monitors gone. */
	syncBlackScreens: (displays: readonly DisplayInfo[]) => void;
}>;
