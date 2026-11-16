/** What a strip slot shows about one monitor or one group of monitors, before it is drawn. */
export type BrightnessStripModel = Readonly<{
	/** The name of the monitor, or what stands for a group; fitted to the slot when drawn. */
	title: string;
	/** The big text: the brightness in percent, "Off", or why there is none. */
	valueText: string;
	/** Whether `valueText` is a sentence and not a figure, so it is drawn smaller. */
	isMessage: boolean;
	/** The brightness the bar shows, `undefined` for no bar fill. */
	percent: number | undefined;
	isOff: boolean;
	hasHdr: boolean;
}>;
