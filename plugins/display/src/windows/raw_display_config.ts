/** Active display paths and modes as Windows returns them: arrays of `DISPLAYCONFIG_PATH_INFO` and `DISPLAYCONFIG_MODE_INFO`. */
export type RawDisplayConfig = Readonly<{
	paths: Buffer;
	pathCount: number;
	modes: Buffer;
	modeCount: number;
}>;
