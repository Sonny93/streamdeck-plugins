/**
 * PnP ids of the monitors that accept a DDC/CI brightness and read it back, yet keep their picture as it was.
 * `SAME05C` is the Samsung Odyssey OLED G9 G95SD.
 */
const MONITORS_IGNORING_DDC_BRIGHTNESS = ['SAME05C'] as const;

/** Tells whether a monitor, known by its device path, ignores the brightness sent over DDC/CI. */
export function ignoresDdcBrightness(monitorId: string): boolean {
	const upperId = monitorId.toUpperCase();
	return MONITORS_IGNORING_DDC_BRIGHTNESS.some((pnpId) =>
		upperId.includes(`#${pnpId}#`)
	);
}
