/** Win32 constants used by the user32 bindings. */
export const Win32Constants = {
	getWindowOwnerCommand: 4,
	showWindowRestoreCommand: 9,
	inputTypeMouse: 0,
	mouseEventMove: 0x0001,
	inputStructSizeBytes: 40,
	flashStopFlags: 0,
	flashStopCount: 0,
	flashStopTimeoutMilliseconds: 0,
	continueEnumeration: true,
	noCallbackParameter: 0,
} as const;
