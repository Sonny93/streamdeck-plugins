import type { EdidInfo } from './edid_info';

/** Builds the id of a monitor from its EDID, such as `IVM6133-0000000000002`: it follows the monitor from one connector to another. */
export function buildEdidMonitorId(edid: EdidInfo): string {
	const pnpId = `${edid.manufacturerId}${edid.productCode}`;
	return edid.serial === undefined ? pnpId : `${pnpId}-${edid.serial}`;
}
