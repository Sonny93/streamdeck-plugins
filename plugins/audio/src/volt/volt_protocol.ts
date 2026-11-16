/** Constants of the vendor HID collection of the Universal Audio Volt 1, deduced by observation (see docs/volt1_hid_protocol.md). */
export const VoltProtocol = {
	/** Fragment of the device interface path of the vendor collection, compared in lower case. */
	interfacePathMarker: 'vid_2b5a&pid_0020',
	/** Size of the input reports Windows delivers; Linux delivers them cut after the meters, 14 bytes. */
	inputReportSize: 40,
	/** Room for any input report on Linux, where a read returns exactly one report. */
	linuxReadBufferSize: 64,
	/** `HID_ID` of the uevent of the Volt 1 on Linux: bus 3 (USB), vendor `2B5A`, product `0020`. */
	linuxHidId: '0003:00002B5A:00000020',
	/** First bytes of the report descriptor of the vendor collection: usage page `0xFF01`. */
	vendorDescriptorPrefix: [0x06, 0x01, 0xff],
	stateReportId: 0x02,
	stateByteIndex: 1,
	settingsReportSize: 17,
	settingsReportId: 0x10,
	settingsByteIndex: 1,
} as const;
