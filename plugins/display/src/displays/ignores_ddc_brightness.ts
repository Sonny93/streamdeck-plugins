import type { DisplayInfo } from './display_info';

/**
 * PnP ids (manufacturer id and product code) of the monitors that accept a DDC/CI brightness and read it back, yet keep their picture as it was.
 * `SAME05C` is the Samsung Odyssey OLED G9 G95SD.
 */
const MONITORS_IGNORING_DDC_BRIGHTNESS = ['SAME05C'] as const;

/** Tells whether a monitor ignores the brightness sent over DDC/CI. */
export function ignoresDdcBrightness(
	display: Pick<DisplayInfo, 'manufacturerId' | 'productCode'>
): boolean {
	const pnpId = `${display.manufacturerId}${display.productCode}`.toUpperCase();
	return MONITORS_IGNORING_DDC_BRIGHTNESS.some((known) => known === pnpId);
}
