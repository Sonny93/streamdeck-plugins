/** What the plugin last read from a monitor over DDC/CI. */
export type DdcReading = Readonly<{
	/** Brightness of the monitor in percent, `undefined` when it has no DDC/CI brightness. */
	brightness: number | undefined;
	/** Raw MCCS power mode, `undefined` when the monitor does not tell. */
	powerMode: number | undefined;
	/** Power mode that turns the monitor off, `undefined` when it cannot be turned off over DDC/CI. */
	standbyMode: number | undefined;
}>;
