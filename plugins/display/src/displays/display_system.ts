import type { DdcMonitor } from './ddc_monitor';
import type { DisplayInfo } from './display_info';

/** What the plugin reads and changes on the monitors of the system; injected so the display hub can be tested without them. */
export type DisplaySystem = Readonly<{
	listDisplays: () => Promise<readonly DisplayInfo[]>;
	/**
	 * Brightness the system gives the picture of a monitor, in percent, apart from the monitor itself:
	 * the gamma ramp in SDR and the "SDR content brightness" in HDR on Windows, the dimming of the compositor on Linux.
	 * `undefined` when the system does not tell.
	 */
	readSystemBrightness: (display: DisplayInfo) => Promise<number | undefined>;
	/** Sets the system brightness and returns the one it took, as the gamma ramp of Windows cannot go below a floor. */
	writeSystemBrightness: (
		display: DisplayInfo,
		percent: number
	) => Promise<number>;
	writeHdr: (display: DisplayInfo, isEnabled: boolean) => Promise<void>;
	/** Opens a monitor for DDC/CI, `undefined` when the system finds no physical monitor behind it. */
	openDdcMonitor: (display: DisplayInfo) => DdcMonitor | undefined;
	/** Whether a black screen can cover a monitor; Wayland lets no program draw one. */
	canBlackScreen: boolean;
	showBlackScreen: (display: DisplayInfo) => void;
	hideBlackScreen: (monitorId: string) => void;
	hasBlackScreen: (monitorId: string) => boolean;
	/** Keeps the black screens over their monitors and on top, and drops those of monitors gone. */
	syncBlackScreens: (displays: readonly DisplayInfo[]) => void;
}>;
