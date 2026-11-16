/** What only the Linux adapter knows about a monitor. */
export type LinuxDisplayData = Readonly<{
	kind: 'linux';
	/** DRM connector name, such as `DP-4`, the one KScreen and ddcutil know the output by. */
	connector: string;
	/** I2C bus of the monitor DDC/CI channel, `undefined` when ddcutil does not find the monitor. */
	busNumber: number | undefined;
}>;
