const DEVICE_PATH_PNP_ID = /^\\\\\?\\DISPLAY#([A-Z]{3})([0-9A-F]{4})#/iu;

/** Reads the manufacturer id and product code out of the device path of a monitor (`\\?\DISPLAY#SAME05C#…`); empty strings when it has none. */
export function parseWindowsPnpId(
	devicePath: string
): Readonly<{ manufacturerId: string; productCode: string }> {
	const match = DEVICE_PATH_PNP_ID.exec(devicePath);
	return {
		manufacturerId: match?.[1]?.toUpperCase() ?? '',
		productCode: match?.[2]?.toUpperCase() ?? '',
	};
}
