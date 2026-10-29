import type { NativePointer } from './native_pointer';

type WindowRect = Readonly<{
	left: number;
	top: number;
	width: number;
	height: number;
}>;

/** The user32 functions that show black, topmost windows over screens; the windows belong to the plugin thread. */
export type WindowApi = Readonly<{
	/** Shows a black window over a rectangle (physical pixels) without taking the focus, `undefined` when Windows refuses. */
	createBlackWindow: (rect: WindowRect) => NativePointer | undefined;
	/** Moves a window back over its rectangle and on top of the other topmost windows, the taskbar included. */
	raiseWindow: (window: NativePointer, rect: WindowRect) => void;
	destroyWindow: (window: NativePointer) => void;
	isWindow: (window: NativePointer) => boolean;
	/** Handles the pending messages of the windows of the plugin thread, so Windows never sees them hang. */
	pumpMessages: () => void;
}>;
