/** The adapter and target id that the Windows display configuration API knows a monitor by, while its topology stays the same. */
export type DisplayTarget = Readonly<{
	adapterLow: number;
	adapterHigh: number;
	id: number;
}>;
