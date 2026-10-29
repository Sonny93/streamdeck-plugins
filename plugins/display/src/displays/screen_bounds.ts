/** Where a screen sits on the Windows desktop, in physical pixels; the primary screen starts at 0,0. */
export type ScreenBounds = Readonly<{
	left: number;
	top: number;
	width: number;
	height: number;
}>;
