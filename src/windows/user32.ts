import type { WindowHandle } from './window_handle';

/** The subset of the Win32 user32 API needed to find, un-flash, compare and activate top-level windows. */
export type User32 = Readonly<{
	listTopLevelWindows: () => WindowHandle[];
	readProcessId: (window: WindowHandle) => number;
	isVisible: (window: WindowHandle) => boolean;
	hasOwner: (window: WindowHandle) => boolean;
	stopFlashing: (window: WindowHandle) => void;
	getForegroundWindow: () => WindowHandle | undefined;
	isMinimized: (window: WindowHandle) => boolean;
	restore: (window: WindowHandle) => void;
	sendZeroMouseMove: () => void;
	setForeground: (window: WindowHandle) => boolean;
}>;
