/** The gamma ramp functions of gdi32, for one screen named by its GDI device name (`\.\DISPLAY1`). */
export type GammaApi = Readonly<{
	/** Reads the 3×256 ramp (red, green, blue), `undefined` when Windows refuses. */
	readGammaRamp: (gdiName: string) => Uint16Array | undefined;
	/** Writes a 3×256 ramp and tells whether Windows took it; it refuses ramps too far from the identity. */
	writeGammaRamp: (gdiName: string, ramp: Uint16Array) => boolean;
}>;
