import type { RawDisplayConfig } from './raw_display_config';

/** The Windows display configuration API (user32), with the structures left as raw buffers. */
export type DisplayConfigApi = Readonly<{
	/** Reads the active paths, or throws when Windows refuses. */
	queryActivePaths: () => RawDisplayConfig;
	/** Sends a `DISPLAYCONFIG_DEVICE_INFO_HEADER` packet that Windows fills in place, and returns the Win32 error code. */
	getDeviceInfo: (packet: Buffer) => number;
	/** Sends a `DISPLAYCONFIG_DEVICE_INFO_HEADER` packet that changes a setting, and returns the Win32 error code. */
	setDeviceInfo: (packet: Buffer) => number;
}>;
