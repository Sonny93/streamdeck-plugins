/** What a strip slot shows about one audio device, before it is drawn. */
export type AudioStripModel = Readonly<{
	/** The name of the device, or what stands for it when there is none; fitted to the slot when drawn. */
	title: string;
	/** The big text: the volume in percent, "Muted", or why there is none. */
	valueText: string;
	/** Whether `valueText` is a sentence and not a figure, so it is drawn smaller. */
	isMessage: boolean;
	/** The volume the bar shows, `undefined` for no bar fill. */
	percent: number | undefined;
	isMuted: boolean;
}>;
