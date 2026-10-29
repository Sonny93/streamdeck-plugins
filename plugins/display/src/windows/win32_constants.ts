/** Win32 constants used by the display, gamma, DDC/CI and window bindings. */
export const Win32Constants = {
	errorSuccess: 0,
	queryOnlyActivePaths: 0x0000_0002,
	/** `DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2`: coordinates are physical pixels on every screen. */
	perMonitorDpiAwareV2: -4,
	monitorDefaultToNull: 0,
	gammaRampLength: 768,
	blackBrush: 4,
	arrowCursor: 32_512n,
	wsPopup: 0x8000_0000,
	wsExTopmost: 0x0000_0008,
	wsExToolWindow: 0x0000_0080,
	wsExNoActivate: 0x0800_0000,
	swShowNoActivate: 4,
	hwndTopmost: -1,
	swpNoActivate: 0x0010,
	swpShowWindow: 0x0040,
	pmRemove: 0x0001,
	messageSize: 48,
	physicalMonitorSize: 264,
	rectSize: 16,
} as const;
