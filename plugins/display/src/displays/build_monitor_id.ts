/** Builds the device path Windows gives a monitor, for tests: `\\?\DISPLAY#<PnP id>#…&UID<uid>#{…}`. */
export function buildMonitorId(pnpId: string, uid: number): string {
	return String.raw`\\?\DISPLAY#${pnpId}#5&1a2b3c4d&0&UID${String(uid)}#{e6f07b5f-ee97-4a90-b076-33f57bf4eaa7}`;
}
