/** `DISPLAYCONFIG_DEVICE_INFO_TYPE` values the plugin sends, with the size of their packet in bytes. */
export const DeviceInfoType = {
	sourceName: { type: 1, size: 84 },
	targetName: { type: 2, size: 420 },
	advancedColorInfo: { type: 9, size: 32 },
	setAdvancedColorState: { type: 10, size: 24 },
	sdrWhiteLevel: { type: 11, size: 24 },
	advancedColorInfo2: { type: 15, size: 36 },
	setHdrState: { type: 16, size: 24 },
	/** Undocumented: what the "SDR content brightness" slider of the Windows HDR settings sends. */
	setSdrWhiteLevel: { type: 0xffff_ffee, size: 28 },
} as const;
