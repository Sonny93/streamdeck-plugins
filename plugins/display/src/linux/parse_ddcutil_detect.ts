const DISPLAY_SECTION = /^Display \d+$/mu;
const I2C_BUS = /^\s*I2C bus:\s+\/dev\/i2c-(\d+)\s*$/mu;
const DRM_CONNECTOR = /^\s*DRM connector:\s+card\d+-(\S+)\s*$/mu;

/** Maps the DRM connectors to the I2C bus of their DDC/CI channel, from the output of `ddcutil detect --terse`; displays without both are skipped. */
export function parseDdcutilDetect(output: string): Map<string, number> {
	const buses = new Map<string, number>();
	for (const section of output.split(DISPLAY_SECTION)) {
		const bus = I2C_BUS.exec(section)?.[1];
		const connector = DRM_CONNECTOR.exec(section)?.[1];
		if (bus !== undefined && connector !== undefined) {
			buses.set(connector, Number.parseInt(bus, 10));
		}
	}
	return buses;
}
