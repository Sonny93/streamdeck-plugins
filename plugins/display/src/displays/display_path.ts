import type { DisplayTarget } from './display_target';

/** One active display path: the monitor it lights and the desktop source it shows, read from `DISPLAYCONFIG_PATH_INFO`. */
export type DisplayPath = Readonly<{
	target: DisplayTarget;
	source: DisplayTarget;
	/** Index of the source mode in the mode array, `undefined` when Windows gives none. */
	sourceModeIndex: number | undefined;
	/** Whether the monitor is turned a quarter (portrait): the source mode then gives its size before the turn. */
	isTurnedQuarter: boolean;
}>;
