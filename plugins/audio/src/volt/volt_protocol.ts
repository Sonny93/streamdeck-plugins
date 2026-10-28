/** Constants of the vendor HID collection of the Universal Audio Volt 1, deduced by observation (see docs/volt1_hid_protocol.md). */
export const VoltProtocol = {
	/** Fragment of the device interface path of the vendor collection, compared in lower case. */
	interfacePathMarker: 'vid_2b5a&pid_0020',
	inputReportSize: 40,
	stateReportId: 0x02,
	stateByteIndex: 1,
	settingsReportSize: 17,
	settingsReportId: 0x10,
	settingsByteIndex: 1,
} as const;
